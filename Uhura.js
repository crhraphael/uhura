const PhraseAppAPI = require('./PhraseAppAPI');
const fs = require('fs')

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
         * Api para download de traduções.
         */
        this.api = new PhraseAppAPI();

        /**
         * Locales que serão processados pelo Uhura.
         */
        this.localesToProcess = locales;

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

            /**
             * Locales da API do PhraseApp, pode ser filtrado pelo 
             * cliente através de argumento por linha de comando.
             */
            let apiLocales = await this.api.getLocales();
            if(apiLocales.err) throw err;

            // Filtro de locale por linha de comando
            apiLocales = apiLocales.filter((locale) => {
                return this.localesToProcess === '*' || this.localesToProcess === locale.code
            })
            

            // Baixando traduções por locales.    
            /**
             * Array de Traduções do PhraseApp por locale=>traduções
             */
            let apiTranslations = [];            
            for(let i = apiLocales.length - 1; i >= 0; i--) {
                const currLocale = Object.create(apiLocales[i]);
                let currTrans = await this.api.getLocaleTranslation(currLocale.id, 'simple_json', true);
                if(currTrans.err) throw err;
                
                apiTranslations[currLocale.code] = currTrans;
            }

            // Variaveis de placeholder...
            /**
             * Placeholders do caminho das traduções.
             */
            let placeholders = this.getPathPlaceholders();

            /**
             * Dados coletados para substituir os placeholders do path.
             */
            let placeholderData = [];
            for(let i = placeholders.length - 1; i >= 0; i--) {
                const currPlaceholder = placeholders[i];
                const variable = this.getVariableFromPlaceHolder(currPlaceholder);

                // variable.value = apiLocales.map((locale) => {
                //     return locale.code
                // })

                placeholderData.push(variable)

                // if(variable.type === 'external') {
                //     this.pathStructure = this.pathStructure.replace(`/(\{${variable}})/g`, )
                // } else {

                // }
            }

            /**
             * Array de traduções que passou por tratamento.
             */
            let treatedTransCollection = [];
            for(let i = apiLocales.length - 1; i >= 0; i--) {
                /**
                 * Locale atual.
                 */
                let currLocale = Object.create(apiLocales[i]);
                treatedTransCollection[currLocale.code] = [];

                let currTranslationCollection = Object.create(apiTranslations[currLocale.code]);

                /**
                 * Array de chaves do locale atual.
                 */
                let translationKeys = Object.keys(currTranslationCollection);
                translationKeys = translationKeys.filter(this.keysConfig.filter);
                for(let j = translationKeys.length - 1; j >= 0; j--) {
                    /**
                     * Chave atual sendo iterada.
                     */
                    let currTransKey = translationKeys[j];
                    
                    // Trim da chave para remover caracteres indesejados (\n).
                    currTransKey = currTransKey.trim();

                    // Lógica do cliente para renomear chaves.
                    currTransKey = this.keysConfig.rename(currTransKey);

                    treatedTransCollection[currLocale.code][currTransKey] = currTranslationCollection[currTransKey];
                }
            } 
            
            // Definição dos arquivos que serão alterados.
            placeholderData = placeholderData[0]; // 0 pois o site consome apenas a regra de placeholder/locale.
            
            /**
             * Coleção de caminhos de arquivos de tradução separados por locales.
             */
            let filepaths = [];
            for(let i = apiLocales.length - 1; i >= 0; i--) {
                /**
                 * Locale sendo iterado.
                 */
                let currLocale = Object.create(apiLocales[i]);

                // Lógica do cliente para renomear locales que serão usados como placeholders.
                if(placeholderData.data.rename) {
                    currLocale.code = placeholderData.data.rename(currLocale.code);
                }

                /**
                 * Caminho completo do arquivo sendo iterado.
                 */
                let filepath = this.pathStructure.replace(placeholderData.phol, currLocale.code)
                if(!fs.existsSync(filepath)) {
                    throw new Error('arquivo de tradução não encontrado', filepath);
                }

                filepaths.push({
                    locale: apiLocales[i],
                    path: filepath
                });
            }

            // Leitura do conteúdo atual dos arquivos de tradução.
            /**
             * Coleção de traduções retirada dos arquivos de tradução
             * e transformada em formato de objeto.
             */
            let currentTranslationFilesData = [];
            for(let i = apiLocales.length - 1; i >= 0; i--) {
                try {
                    /**
                     * Locale sendo iterado.
                     */
                    let currLocale = Object.create(apiLocales[i]);

                    /**
                     * Caminho do arquivo de tradução do locale.
                     */
                    let currFilePath = filepaths.filter((fConfig) => {
                        return fConfig.locale.code === currLocale.code
                    })[0].path

                    /**
                     * Buffer do arquivo atual sendo iterado.
                     */
                    let fileBuffer = fs.readFileSync(currFilePath)

                    /**
                     * Conteúdo das traduções transformado em objeto 
                     * através da lógica de JSON parser.
                     */
                    let storedContent = fileBuffer.toString();
                    try {                            
                        storedContent = JSON.parse(storedContent);
                    } catch(err) {
                        if(!this.fileConfig.hasOwnProperty('toJSON')) {
                            throw new Error('o arquivo informado não foi tratado como json, tente implementar uma alteração no conteúdo do arquivo que torne-o um JSON válido através do hook file->toJSON')
                        }
                        storedContent = this.fileConfig.toJSON(storedContent);
                    }

                    storedContent = JSON.parse(storedContent);

                    currentTranslationFilesData[currLocale.code] = {};
                    currentTranslationFilesData[currLocale.code] = storedContent;
                } catch(err) {
                    if (err.code === 'ENOENT') {
                        console.log('File not found!');
                        return false;
                    } else {
                        throw err;
                    }
                }
            }

            // Comparação do novo arquivo de traduções com o atual.
            for(let i = apiLocales.length - 1; i >= 0; i--) {
                /**
                 * Locale sendo iterado.
                 */
                let currLocale = Object.create(apiLocales[i]);

                /**
                 * Coleção de traduções com chaves devidamente tratadas.
                 */
                let newTranslations = treatedTransCollection[currLocale.code]

                /**
                 * Coleção de traduções presentes no projeto do cliente.
                 */
                let oldTranslations = currentTranslationFilesData[currLocale.code]

                // Comparar valores
                let keys = Object.keys(oldTranslations);
                for(let j = keys.length - 1; j >= 0; j--) {
                    /**
                     * Chave de tradução atual sendo iterada.
                     */
                    const currKey = keys[j];
                    if(oldTranslations.hasOwnProperty(currKey)) {
                        console.log('o arquivo de tradução possui a chave: ' + currKey)
                        if(newTranslations[currKey] !== oldTranslations[currKey]) {
                            console.log('o valor foi modificado')
                            console.log(newTranslations[currKey])
                            console.log(oldTranslations[currKey])
                        } 

                        console.log('o valor é identico ')
                        continue;
                    } else {
                        console.log('não possui a chave ' + currKey)
                    }
                }
            }
        } catch(err) {
            console.log(err)
        } finally {
    
        }
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
        let phol = undefined;

        // TODO: Verificar se podemos ter o mesmo nome de variável em tipos diferentes.
        const variableTypes = Object.keys(this.pathVariables)
        for(let i = variableTypes.length - 1; i >= 0; i--) {
            const currVariableType = variableTypes[i];
            if(this.pathVariables[currVariableType].hasOwnProperty(sanitizedPlaceholder)) {
                data = this.pathVariables[currVariableType][sanitizedPlaceholder];
                phol = placeholder;
                type = currVariableType;
            }
        }
        return { data, phol, type }
    }

    getPathPlaceholders() {        
        const regex = /(\{\w+\})/g;
        return this.pathStructure.match(regex)
    }
}