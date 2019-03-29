var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    // .command('count', 'Count the lines in a file')
    // .example('$0 count -cf .uhura.js', 'count the lines in the given file')
    .alias('c', 'config-file')
    .nargs('c', 1)
    .default('c', '.uhura.js')    
    .describe('c', 'Set the config file path')
    .demandOption(['c'])
    .alias('f', 'flow')
    .default('f', 'default')
    .nargs('f', 1)
    .describe('f', 'Select the config file flow to run')
    .help('h')
    .alias('h', 'help')
    .epilog('Developed by Adriano Vianna, Fernando Barbosa, Crhistian Raphael and Rodolpho Guerreiro!')
    .argv;
    
module.exports = argv