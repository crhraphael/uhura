var axios = require('axios');
var envJS = require('./env');

module.exports = class PhraseAppAPI {
    constructor() {
        this.endpoint = 'https://api.phraseapp.com/api/v2';
        this.repositoryId = envJS.PHRASEAPP_REPO_ID;
    }
    /**
     * Retorna os locales salvos no PhraseApp.
     * 
     * @returns {Object}
     */
    async getLocales() {
        var resp = [];
        try {
            var locales = await axios.get(this.endpoint + '/projects/' + this.repositoryId + '/locales', {
                params: {
                    access_token: envJS.PHRASEAPP_TOKEN,
                }
            })            
            resp = locales.data;
        } catch (err) {
            console.log('erro ao baixar locales' + err);
            resp = { err };
        } finally {
            return resp;
        }
    }    

    /**
     * Retorna as traduções baseado no fileFormat.
     * 
     * Pode retornar traduções não verificadas se unverifiedTranslations for 'true'.
     * 
     * @returns {Array} Traduções
     */
    async getLocaleTranslation(localeId, fileFormat, unverifiedTranslations = false) {
        var resp = [];
        try {
            var trans = await axios.get(this.endpoint + '/projects/' + this.repositoryId + '/locales/' + localeId + '/download', {
                params: {
                    access_token: envJS.PHRASEAPP_TOKEN,
                    include_unverified_translations: unverifiedTranslations,
                    encoding: 'UTF-8',
                    file_format: fileFormat
                }
            })
            trans = trans.data;
            resp = trans;
        } catch (err) {
            console.log('erro ao baixar tradução do locale ' + locale, err)
            resp = { err }
        } finally {
            return resp;
        }
    }

    async getTrans(tagList, localeId) {
        var resp = [];
        try {
            var trans = await axios.get(this.endpoint + '/projects/' + this.repositoryId + '/keys', {
                params: {
                    access_token: envJS.PHRASEAPP_TOKEN,
                    include_unverified_translations: unverifiedTranslations,
                    encoding: 'UTF-8',
                    file_format: fileFormat,
                    q: `tags:${taglist}`,
                    locale_id: localeId
                }
            })
            trans = trans.data;
            resp = trans;
        } catch (err) {
            console.log('erro ao baixar tradução do locale ' + locale, err)
            resp = { err }
        } finally {
            return resp;
        }
    }
}
