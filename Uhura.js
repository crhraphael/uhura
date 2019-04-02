var FileParser = require('./FileParser');
var PhraseAppAPI = require('./PhraseAppAPI');
const fs = require('fs')
//Construir path
// let path = config.js.path.structure;
// let variables = config.js.path.variables;
//fp.allFilesSync('./i18n')

module.exports = class Uhura {
    constructor(configFile, flow, locales) {
        /**
         * Valida se o arquivo de configuração existe.
         */
        if(!fs.existsSync(configFile)) {
            throw new Error(`arquivo de configuração não encontrado: ${configFile}`)
        } 

        /**
         * Armazena as configurações presentes no arquivo de configuração.
         */
        this.config = require(`${__dirname}/${configFile}`)

        // TODO: Validar this.config

        // Valida se flow é um fluxo existente na configuração.
        if(!this.config.flows.hasOwnProperty(flow)) {
            const disponibleFlows = Object.keys(this.config.flows)
            throw new Error(`fluxo '${flow}' não encontrado no arquivo de configuração. Você quis dizer: ${disponibleFlows.join(' or ')}`)
        }

        /**
         * Fluxo sendo executado.
         */
        this.flow = flow

        /**
         * Leitor de arquivos em diretórios.
         */
        this.fp = new FileParser();

        /**
         * Api para download de traduções.
         */
        this.api = new PhraseAppAPI();

        /**
         * Locales que serão processados pelo Uhura.
         */
        this.localesToProcess = locales;

        /**
         * Chaves necessárias para o funcionamento da lógica.
         * 
         * Trata o retorno do filtro de locales quando há um.
         */
        this.localeFilterRequiredKeys = [
            'id',
            'code',
        ];

        this.currentFlowConfig = this.config.flows[this.flow];

        this.pathStructure = this.config.flows[this.flow].path.structure;
        this.pathVariables = this.config.flows[this.flow].path.variables;

        this.fileConfig = this.config.flows[this.flow].file;
        this.keysConfig = this.config.flows[this.flow].keys;

        /**
         * Função declarada no arquivo .uhura.js pelo cliente 
         * chamada para filtrar chaves da aplicação, se necessário.
         */
        this.filterTranslationKeys = false

        /**
         * Função declarada no arquivo .uhura.js pelo cliente 
         * chamada para mapear o nome das chaves, se necessário.
         */
        this.mapTranslationKeys = false
    }

    /**
     * Executa a lógica da aplicação.
     */
    async execute() {
        try {           
            // Baixando locales...
            let apiLocales = await this.api.getLocales();
            if(apiLocales.err) throw err;

            // Filtro de locale por linha de comando
            apiLocales = apiLocales.filter((locale) => {
                return this.localesToProcess === '*' || this.localesToProcess === locale.code
            })
            

            // Baixando traduções por locales.    
            let translations = [];            
            for(let i = apiLocales.length - 1; i >= 0; i--) {
                const currLocale = apiLocales[i];
                let currTrans = await this.api.getLocaleTranslation(currLocale.id, 'simple_json', true);
                if(currTrans.err) throw err;
                
                translations[currLocale.code] = currTrans;
            }


            //Baixando traduções por locale/tag.
            //let trans = await this.api.getLocaleTranslation(locale.id, 'nested_json', true, 'Affiliate-tag')

            // Variaveis de placeholder...
            let placeholders = this.getPathPlaceholders();
            let variableData = [];
            for(let i = placeholders.length - 1; i >= 0; i--) {
                const currPlaceholder = placeholders[i];
                const variable = this.getVariableFromPlaceHolder(currPlaceholder);

                // variable.value = apiLocales.map((locale) => {
                //     return locale.code
                // })

                variableData.push(variable)

                // if(variable.type === 'external') {
                //     this.pathStructure = this.pathStructure.replace(`/(\{${variable}})/g`, )
                // } else {

                // }
            }

            // Trim keys...
            let fixedTranslationsCollection = [];
            for(let i = apiLocales.length - 1; i >= 0; i--) {
                /**
                 * Locale atual.
                 */
                let currLocale = apiLocales[i];
                fixedTranslationsCollection[currLocale.code] = [];
                /**
                 * Array de chaves do locale atual.
                 */
                let translationKeys = Object.keys(translations[currLocale.code]);
                for(let j = translationKeys.length - 1; j >= 0; j--) {
                    /**
                     * Chave atual sendo iterada.
                     */
                    let currTransKey = translationKeys[j];
                    
                    if(this.keysConfig.filter(currTransKey)) {
                        currTransKey = currTransKey.trim();
                        currTransKey = this.keysConfig.rename(currTransKey);
                        /**
                         * Conteúdo da chave sendo iterada.
                         */
                        let currTransData = translations[currLocale.code][translationKeys[j]];
                        fixedTranslationsCollection[currLocale.code][currTransKey] = currTransData;
                    }
                }
            } 
            
            // Loop de atualização de conteúdo.
            variableData = variableData[0];
            for(let i = apiLocales.length - 1; i >= 0; i--) {
                let currLocale = apiLocales[i];
                if(variableData.data.rename) {
                    currLocale.code = variableData.data.rename(currLocale.code);
                }

                try {
                    let filepath = this.pathStructure.replace('{'+ variableData.name + '}', currLocale.code)
                    if(!fs.existsSync(filepath)) {
                        console.log('arquivo base não encontrado.. pular step de validação para este locale?')
                        continue;
                    } else {
                        let fileBuffer = fs.readFileSync(filepath)
                        var storedContent = fileBuffer.toString()
                        try {                            
                            storedContent = JSON.parse(storedContent);
                        } catch(err) {
                            if(!this.fileConfig.hasOwnProperty('toJSON')) {
                                throw new Error('o arquivo informado não foi tratado como json, tente implementar uma alteração no conteúdo do arquivo que torne-o um JSON válido através do hook file->toJSON')
                            }
                            storedContent = this.fileConfig.toJSON(storedContent);
                        } 

                        console.log(storedContent);
                        storedContent = JSON.parse(storedContent, null, '\t');
                        return;

                        let keys = Object.keys(storedContent);
                        for(let j = keys.length - 1; j >= 0; j--) {
                            const currKey = keys[j];
                            if(fixedTranslationsCollection[apiLocales[i].code].hasOwnProperty(currKey)) {
                                console.log('possui a chave ' + currKey)
                                if(fixedTranslationsCollection[apiLocales[i].code][currKey] === storedContent[currKey]) {
                                    console.log('o valor é identico ')                                    
                                } else {
                                    console.log('o valor foi modificado')
                                }
                            } else {
                                console.log('não possui a chave ' + currKey)
                            }
                        }
                    }


                } catch(err) {
                    if (err.code === 'ENOENT') {
                        console.log('File not found!');
                        return false;
                    } else {
                        throw err;
                    }
                }
            }
            
            // Comparar chaves (apenas simple_json)? 
        } catch(err) {
            console.log(err)
        } finally {
    
        }
    }

    /**
     * Normaliza as chaves que possuem caracteres indesejados.
     * 
     * @param {*} translation 
     */
    normalizeKeys(translation) {
        let keys = Object.keys(translation)
        let normalizedTranslation = {}
        for(let i = keys.length - 1; i >= 0; i--) {
            let currKey = keys[i];            
            let normalizedKey = currKey.trim();
            normalizedTranslation[normalizedKey] = translation[currKey];
        }

        return normalizedTranslation;
    }

    /**
     * Era usado no loop do download das traduções.
     */
    filtraRenomeiaNormaliza() {
        
        // Faz filtragem de traduções de acordo coma lógica do cliente.
        if (this.filterTranslationKeys !== false) { 
            let filteredKeysDataset = {};
            const keys = Object.keys(currTrans);
            for(let j = keys.length - 1; j >= 0; j--) {
                const currentKey = keys[j];
                if (this.filterTranslationKeys(currentKey)) {
                    filteredKeysDataset[currentKey] = currTrans[currentKey];
                }
            }
            currTrans = filteredKeysDataset;
        }

        // Renomeia as chaves de acordo com a lógica do cliente.
        if(this.mapTranslationKeys !== false) {
            let renameKeysDataset = {};
            const keys = Object.keys(currTrans);
            for(let j = currTrans.length - 1; j >= 0; j--) {
                const currentKey = keys[j];
                let renamedKey = this.mapTranslationKeys(currentKey);
                renameKeysDataset[renamedKey] = currTrans[currentKey];
            }
            currTrans = renameKeysDataset;
        }

        // Normaliza as chaves da aplicação removendo ENTER e SPACE.
        currTrans = this.normalizeKeys(currTrans);
    }

    /**
     * Retorna a variavel que representa o placeholder
     * 
     * @param {*} placeholder 
     */
    getVariableFromPlaceHolder(placeholder) {
        const sanitizedPlaceholder = placeholder.replace('{', '').replace('}', '')
        let data = undefined;
        let type = undefined;
        let name = undefined;

        // TODO: Verificar se podemos ter o mesmo nome de variável em tipos diferentes.
        const variableTypes = Object.keys(this.pathVariables)
        for(let i = variableTypes.length - 1; i >= 0; i--) {
            const currVariableType = variableTypes[i];
            if(this.pathVariables[currVariableType].hasOwnProperty(sanitizedPlaceholder)) {
                data = this.pathVariables[currVariableType][sanitizedPlaceholder];
                name = sanitizedPlaceholder;
                type = currVariableType;
            }
        }
        return { data, name, type }
    }

    getPathPlaceholders() {        
        const regex = /(\{\w+\})/g;
        return this.pathStructure.match(regex)
    }
}