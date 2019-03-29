const locales = [ 
    'pt-br', 
    'en', 
    'de-de',
    'es',
];
const affLocales = [
    'pt-BR', 'en', 'es'
]

const affModules = [
    'A', 'B' 
]

/**
 * --config-file path/to/config_file.js
 */
module.exports = {
    "config": {
        "locales": {
            "val": locales,
            "filter": function(locale) {
                let currLocale = locale;
                switch(currLocale) {
                    case 'en':
                        currLocale = 'en-US';
                        break;
                    case 'es':
                        currLocale = 'es-ES';
                        break;
                    default:
                        let {lang, loca} = currLocale.split('-');
                        currLocale = lang + '-' + loca.toUpperCase();
                }
                return currLocale;
            } 
        }
    },
    "flows": {
        /**
         * --flow php
         */
        "php": {
            "path": {
                "structure": './ProjectTranslations/translations/messages.{locale}.php',
                "variables": {
                    'locale': {
                        "val": locales,
                        "rename": function(locale) {
                            let currLocale = locale;
                            switch(currLocale) {
                                case 'en':
                                    currLocale = 'en-US';
                                    break;
                                case 'es':
                                    currLocale = 'es-ES';
                                    break;
                            }
                            return currLocale;
                        },
                    },
                },
            },
            "keys": {
                "filter": function(translation) {
                    return key.indexOf('key_starts_with.') !== -1;
                },
                "rename": function(translation) {
                    return key.replace('key_starts_with.', '');
                }
            }
        },
        "ruby": {
            "path": {
                "structure": './ProjectTranslations/app/{module}/Resources/lang/{locale}/{tag}.php',
                "variables": {
                    /**
                     * API disponible variables...
                     */
                    "internal": {
                        "tag": {
                            "filter": function(tag, externalVars) {
                                const modules = externalVars.module.values;
                                let willBeFiltered = false;
                                for(let i = modules.length - 1; i >= 0; i--) {
                                    const currModule = modules[i]
                                    if(tag.indexOf(currModule) !== -1) 
                                        willBeFiltered = !willBeFiltered
                                }
                                return willBeFiltered
                            },
                            "rename": function(tag) {
                                return tag.split('-')[1]
                            }
                        }
                    },
                    /**
                     * Client variables...
                     */
                    "external": {
                        "locale": {
                            "values": affLocales,
                        },
                        "module": {
                            "values": affModules
                        },
                    }
                },
            },
            /**
             * Every key custom filtering and mapping...
             */
            "keys": {            
                /**
                 * Custom rules to filter keys...
                 */
                "filter": function(translation) {
                    return key.indexOf('key_starts_with.') !== -1;
                },
                /**
                 * Custom rules to rename keys...
                 */
                "rename": function(translation) {
                    return key.replace('key_starts_with.', '');
                }
            }
        },
        "js": {
            "path": {
                "structure": './ProjectTranslations/i18n/{locale}/translations.js',
                "variables": {
                    'locale': {
                        "values": locales,
                        "rename": function(locale) {
                            let currLocale = loc;
                            switch(currLocale) {
                                case 'en':
                                    currLocale.code = 'en-US';
                                    break;
                                case 'es':
                                    currLocale.code = 'es-ES';
                                    break;
                            }
                            return currLocale;
                        },
                    },
                },
            },
            "keys": {
                /**
                 * Custom rules to filter keys...
                 */
                "filter": function(translation) {
                    return key.indexOf('key_starts_with_js.') !== -1;
                },
                /**
                 * Custom rules to rename keys...
                 */
                "rename": function(translation) {
                    return key.replace('key_starts_with_js.', '');
                }
            }
        }
    }
}