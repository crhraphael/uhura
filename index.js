var PhraseAppAPI = require('./PhraseAppAPI');
var Uhura = require('./Uhura');
var argv = require('./ArgvParser');

let program = new Uhura(argv.configFile, argv.flow)
//program.execute();