const chalk = require('chalk');

const log = (message, symbol, color) => {
    const symbols = {
        '+': chalk.green('✓'),
        'x': chalk.red('✗'),
        '!': chalk.yellow('⚠'),
        'i': chalk.blue('ℹ')
    };

    const symbolToShow = symbols[symbol] || symbols['i'];
    console.log(`${symbolToShow} ${chalk.white(message)}`);
};

module.exports = { log };
