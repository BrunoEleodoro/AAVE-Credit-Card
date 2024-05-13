const axios = require('axios');
const dotenv = require('dotenv');
const BigNumber = require('bignumber.js');
const ethers = require('ethers');

dotenv.config();

const GRAPH_QL_URL = process.env.GRAPH_QL_URL;
const query = `query MyQuery {
    transfers(
      where: {to: "0x0cC9D7fAc744E700F44E307eD90c07EC54e51D9A"}
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      from
      blockTimestamp
      blockNumber
      to
      transactionHash
      value
    }
  }`
const AAVECreditCardABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "borrow",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
]

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Function to create a provider and set up listeners
function setupProvider(url) {
    let provider = new ethers.JsonRpcProvider(url);

    provider.on("error", (err) => {
        console.error(`Provider error: ${err}. Attempting to reconnect...`);
        setTimeout(() => setupProvider(url), 3000); // Reconnect after 3 seconds
    });

    return provider;
}

async function main() {
    const arbProvider = setupProvider(process.env.ARB_PROVIDER_URL);
    const arbWallet = new ethers.Wallet(process.env.ARB_PRIVATE_KEY, arbProvider);
    const AAVECreditCardContract = new ethers.Contract(process.env.AAVE_CREDIT_CARD_ADDRESS, AAVECreditCardABI, arbWallet);

    // Create a contract instance
    let response = undefined;

    while (true) {
        try {
            console.log('querying...');
            const res = await axios.post(GRAPH_QL_URL, { query });

            if (response === undefined) {
                response = res.data.data.transfers;
            } else {
                if (response && response[0].id !== res.data.data.transfers[0].id) {
                    console.log(res.data.data.transfers);
                    console.log('New transfer found!');
                    const transfer = res.data.data.transfers[0];
                    const amount = BigNumber(transfer.value);

                    // Calculate the dollar equivalent on Arbitrum
                    const dollarsOnArb = amount.dividedBy(10 ** 18).multipliedBy(5).multipliedBy(10 ** 6);
                    const finalAmount = dollarsOnArb.integerValue(BigNumber.ROUND_FLOOR);
                    console.log('Dollars on arb:', finalAmount.toString());
                    console.log(arbWallet.address)

                    try {
                        const resBorrow = await AAVECreditCardContract.borrow(finalAmount.toString(), { gasLimit: 1000000 });
                        response = res.data.data.transfers;
                        console.log('BORROW!!')
                        console.log(resBorrow);
                    } catch (err) {
                        console.error('Error executing borrow:', err);
                    }
                } else {
                    console.log('No new transfers found.');
                }
            }
        } catch (error) {
            console.error(error);
        }

        await sleep(60000);
    }
}

main();
