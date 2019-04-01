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
        console.log(this.getPathPlaceholders());
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

            let placeholders = this.getPathPlaceholders();
            for(let i = placeholders.length - 1; i >= 0; i--) {
                const currPlaceholder = placeholders[i];
                const variable = this.getVariableFromPlaceHolder(currPlaceholder);

                if(variable.type === 'external') {

                } else {

                }
            }

            // Ler e processar arquivos de tradução de acordo com as regras do cliente.
            for(let i = apiLocales.length - 1; i >= 0; i--) {
                /**
                 * Locale atual.
                 */
                let currLocale = apiLocales[i];

                /**
                 * Array de chaves do locale atual.
                 */
                let translationKeys = Object.keys(translations[currLocale.code]);
                for(let j = translationKeys.length - 1; j >= 0; j--) {
                    /**
                     * Chave atual sendo iterada.
                     */
                    let currTransKey = translationKeys[j];
                    /**
                     * Conteúdo da chave sendo iterada.
                     */
                    let currTransData = translations[currLocale.code][currTransKey];

                    // Montar filepath
                    console.log(currTransData)
                }
                return currTransData;
                    // 
                    filepathBase = '/ProjectTranslations/';
    
                    filepathStructure = 'i18n/{LOCALE}/translations.js';
                    filepath = 'language/{LOCALE}/default.php';
                    filepath = 'translations/messages.{LOCALE}.php';
                    // filepath = '/ProjectTranslations/{MODULE}/lang/{DIR}/messages.{LOCALE}.php';
                    try {
                        fileBuffer = fs.readFileSync(filepath)
                    } catch(err) {
                        if (err.code === 'ENOENT') {
                            console.log('File not found!');
                            return false;
                        } else {
                            throw err;
                        }
                    }
                    // Comparar chaves (apenas simple_json)? 
                
            } 
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
        let variable = undefined;
        let type = undefined;

        // TODO: Verificar se podemos ter o mesmo nome de variável em tipos diferentes.
        const variableTypes = Object.keys(this.pathVariables)
        for(let i = variableTypes.length - 1; i >= 0; i--) {
            const currVariableType = variableTypes[i];
            if(this.pathVariables[currVariableType].hasOwnProperty(sanitizedPlaceholder)) {
                variable = this.pathVariables[currVariableType][sanitizedPlaceholder]
                type = currVariableType
            }
        }
        return { variable, type }
    }

    getPathPlaceholders() {        
        const regex = /(\{\w+\})/g;
        return this.pathStructure.match(regex)
    }
}