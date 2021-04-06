//Dependencies.
const { Client, Message } = require('discord.js');
const dotenv = require('dotenv');
const axios = require('axios').default;
const contractAddressSafemoon = "0x8076c74c5e3f5852037f31ff0093eeb8c8add8d3"; //SAFEMOON Contract Address
const cmcIDSafeMoon = "8757" ;
const contractAddressSafeBTC = "0x380624a4a7e69db1ca07deecf764025fc224d056"; //SAFEBTC Contract Address
const cmcIDSafeBTC = "8993" ;
const contractAddressFairEclipse = "0x4f45f6025be6c65573daa0b9965a75e837848da0"; //FairEclipse Contract Address
const cmcIDFairEclipse = "" ;
const contractAddressMonero = "DNE"; //BinanceCoin Contract Address
const cmcIDMonero = "328" ;
const contractAddressBinanceCoin = "DNE"; //BinanceCoin Contract Address
const cmcIDBinanceCoin = "1839" ;

//Load Environment
dotenv.config();
console.log(process.env.DISCORD_TOKEN);

//Create an instance of client
const client = new Client();

//Login
client.login(process.env.DISCORD_TOKEN);
client.on('ready', async () => {
    console.log(client.user.tag + ' has logged in.');
    client.user.setPresence({
        status: "online",
        activity: {
            name: "BSC Mainnet",
            type: "WATCHING" // PLAYING, WATCHING, LISTENING, STREAMING,
        }
    }).catch(console.error);
});

/**
 * Update the discord rich presence price every 20 seconds.
 */
setInterval(async () => {
    client.user.setPresence({
        status: "online",
        activity: {
            name: "BSC Mainnet",
            type: "WATCHING" // PLAYING, WATCHING, LISTENING, STREAMING,
        }
    }).catch(console.error);
}, 20 * 1000);

/**
 * Function for obtaining data from Dex.Guru's API.
 * @returns Dex.Guru's API data
 */
async function getApi(contractAddress) {
    try {
		let contractAddressAPI = contractAddress;
        let response = await axios.get('https://api.dex.guru/v1/tokens/' + contractAddressAPI + '-bsc/');
        return response.data;
    } catch (err) {
        console.log(err);
        return "Failed";
    }
}

/**
 * Function for obtaining the total burned supply from BSCSCAN.
 * @returns total Burned Supply to-date.
 */
async function getBurnedTotal(contractAddress) {
    try {
		let contractAddressBurned = contractAddress;
		let url = ('https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=' + contractAddressBurned + '&address=0x0000000000000000000000000000000000000001&tag=latest&apikey=YOUR_API_KEY_GOES_HERE');
        let response = await axios.get(url);
        let value = response.data['result'];
        value = (value / 1_000_000_000_000_000_000_000).toFixed(4);
        return value;
    } catch (err) {
        console.log(err);
        return "Failed";
    }
}

/**
 * Function for obtaining data from CoinMarketCap's Api.
 * @returns CoinMarketCap's widget API json data
 */
async function getCMCData(cmcID) {
    try {
        let response = await axios.get('https://3rdparty-apis.coinmarketcap.com/v1/cryptocurrency/widget?id=' + cmcID);
        return response.data;
    } catch (err) {
        console.log(err);
        return "Failed"
    }
}

/**
 * Method for getting the current price.
 * @returns price
 */
async function getPrice(contractAddress) {
    try {
		let contractAddressPrice = contractAddress;
		let dexGuruData = await getApi(contractAddressPrice);
        price = dexGuruData['priceUSD'];
        price *= Math.pow(10, 10);
        return price.toPrecision(6);
    } catch (err) {
        console.log(err);
        return "Failed";
    }
}

/**
 * Function for sending the stand-alone price to a specific channel.
 */
let previousPrice, price;
async function postPrice(channelId,contractAddress) {
    try {
		let contractAddressPostPrice = contractAddress;
        let price = await getPrice(contractAddressPostPrice);
        let channel = client.channels.cache.get(channelId);
        if (price > 0) {
            let emoji = price > previousPrice ? ":green_circle:" : ":red_circle:";
            await channel.send(emoji + " " + price);
            previousPrice = price;
        }
    } catch (err) {
        console.log(err);
        return "Failed";
    }
}


async function tokenPriceTable(TokenName,cmcID,channelId,contractAddress) {
    try {
		let contractAddressTable = contractAddress;
		let cmcIDCurrent = cmcID;
        let dexGuruData = await getApi(contractAddressTable);
        let price = dexGuruData['priceUSD'].toFixed(dexGuruData['decimals']);
        let volume = (dexGuruData['volume24hUSD'] / 1_000_000).toFixed(4);
        let channel = client.channels.cache.get(channelId);

		let burnTotal = await getBurnedTotal(contractAddressTable);
        let timeStamp = Date.now();

        let cmcData = await getCMCData(cmcID);
        let cmcBase = cmcData.data[cmcIDCurrent];
        let cmcQuote = cmcBase['quote']['USD'];
        let total_supply = cmcBase['total_supply'];
        let marketCap = ((total_supply * price) / 1_000_000).toFixed(4);

        let change1h = cmcQuote['percent_change_1h'].toFixed(4);
        let change24h = cmcQuote['percent_change_24h'].toFixed(4);
        let change7d = cmcQuote['percent_change_7d'].toFixed(4);

        await channel.send({
            embed: {
                "title": "**" + contractAddressTable + "**",
                "description": "This bot will automatically post new stats every 10 minutes.",
                "url": "https://bscscan.com/address/" + contractAddressTable,
                "color": 2029249,
                "timestamp": timeStamp,
                "footer": {
                    "text": TokenName + " Price Bot - Values based on USD."
                },
                "thumbnail": {
                    "url": "https://s2.coinmarketcap.com/static/img/coins/64x64/" + cmcIDCurrent + ".png"
                },
                "author": {
                    "name": TokenName + " Price Bot",
                    "url": "http://www.redshiftent.com"
                },
                "fields": [
                    {
                        "name": "💸 Price",
                        "value": "$" + price,
                        "inline": true
                    },
                    {
                        "name": "🧊 Volume",
                        "value": "$" + volume + "M",
                        "inline": true
                    },
                    {
                        "name": "💰 Market Cap",
                        "value": marketCap + "M",
                        "inline": true
                    },
                    {
                        "name": "🏦 Total Supply",
                        "value": "1000T",
                        "inline": true
                    },
                    {
                        "name": "🔥 Total Burned",
                        "value": burnTotal + "T",
                        "inline": true
                    },
                    {
                        "name": "💱 Circ Supply",
                        "value": (total_supply / 1_000_000_000_000).toFixed(2) + "T",
                        "inline": true
                    },
                    {
                        "name": "💯 1hr Change",
                        "value": change1h > 0 ? "⬆️ " + change1h + "%" : "⬇️ " + change1h + "%",
                        "inline": true
                    },
                    {
                        "name": "📈 24hr Change",
                        "value": change24h > 0 ? "⬆️ " + change24h + "%" : "⬇️ " + change24h + "%",
                        "inline": true
                    },
                    {
                        "name": "📈 7D Change",
                        "value": change7d > 0 ? "⬆️ " + change7d + "%" : "⬇️ " + change7d + "%",
                        "inline": true
                    }
                ]
            }
        });
    } catch (err) {
        console.log(err);
    }
}

/**
 * Sends the stand-alone price every 20 seconds to desired channel.
 */
setInterval(() => postPrice("828326404914544671",contractAddressSafemoon), 30 * 1000); //Channel Id and contractAddress Const
setInterval(() => postPrice("828326426922319902",contractAddressSafeBTC), 30 * 1000); //Channel Id and contractAddress Const
setInterval(() => postPrice("828946688335937566",contractAddressFairEclipse), 30 * 1000); //Channel Id and contractAddress Const

/**
 * Basic message command.
 */
client.on('message', message => {
    if (message.content == '!price') {
        postPrice(message.channel.id);
    }
});

//priceTable('SafeMoon',cmcIDSafeMoon,"828326404914544671",contractAddressSafemoon)

/**
 * Function for sending the Embedded price display every 10 minutes.
 */
setInterval(() => tokenPriceTable('SafeMoon',cmcIDSafeMoon,'828326404914544671',contractAddressSafemoon), 600 * 1000); //(x * 1000) this will post in the designated channel every 'x' seconds.
setInterval(() => tokenPriceTable('SafeBTC',cmcIDSafeBTC,'828326426922319902',contractAddressSafeBTC), 600 * 1000); //(x * 1000) this will post in the designated channel every 'x' seconds.
//setInterval(() => tokenPriceTable('FairEclipse',cmcIDFairEclipse,'828326490760282202',contractAddressFairEclipse), 600 * 1000); //(x * 1000) this will post in the designated channel every 'x' seconds.
//setInterval(() => priceTable('Monero',cmcIDMonero,'828326448758521888',contractAddressMonero), 600 * 1000); //(x * 1000) this will post in the designated channel every 'x' seconds.
