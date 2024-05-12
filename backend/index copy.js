const ethers = require('ethers');
const BigNumber = require('bignumber.js');
const dotenv = require('dotenv');
dotenv.config();

const erc20ABI = [
    "event Transfer(address indexed from, address indexed to, uint amount)"
];
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

// Function to create a provider and set up basic error handling
function setupProvider(url) {
    let provider = new ethers.JsonRpcProvider(url);

    provider.on("error", (err) => {
        console.error(`Provider error: ${err}.`);
        if (err.message.includes("Method not available")) {
            console.error("Unsupported method encountered, check the provider compatibility.");
        } else {
            console.log("Attempting to reconnect...");
            setTimeout(() => setupProvider(url), 3000); // Reconnect after 3 seconds
        }
    });

    return provider;
}

const arbProvider = setupProvider(process.env.ARB_PROVIDER_URL);
const celoProvider = setupProvider(process.env.CELO_PROVIDER_URL);
const arbWallet = new ethers.Wallet(process.env.ARB_PRIVATE_KEY, arbProvider);

const tokenAddress = '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787';

// Create a contract instance
const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, celoProvider);
const myAddress = '0x0cC9D7fAc744E700F44E307eD90c07EC54e51D9A';

const AAVECreditCardContract = new ethers.Contract(process.env.AAVE_CREDIT_CARD_ADDRESS, AAVECreditCardABI, arbWallet);

// Polling function to check for transfer events
async function pollTransfers() {
    const filter = tokenContract.filters.Transfer(null, myAddress);
    let startBlock = await celoProvider.getBlockNumber() - 600; // Start looking 600 blocks back
    console.log('Start block:', startBlock);
    setInterval(async () => {
        const events = await tokenContract.queryFilter(filter, startBlock);
        console.log('Polling...', events.length, 'events found');
        for (let event of events) {
            const { from, to } = event.args;
            const amount = BigNumber(event.args.amount.toString());
            console.log(`Polled transfer to ${myAddress} | from: ${from} | amount: ${amount} | blockNumber: ${event.blockNumber}`);

            // Calculate the dollar equivalent on Arbitrum
            const dollarsOnArb = amount.dividedBy(10 ** 18).dividedBy(5).multipliedBy(10 ** 6);
            const finalAmount = dollarsOnArb.integerValue(BigNumber.ROUND_FLOOR);
            console.log('Dollars on arb:', finalAmount.toString());
            console.log(arbWallet.address)

            // try {
            //     const res = await AAVECreditCardContract.borrow(finalAmount.toString(), { gasLimit: 1000000 });
            //     console.log('BORROW!!')

            //     console.log(res);
            // } catch (err) {
            //     console.error('Error executing borrow:', err);
            // }
        }
        // Update startBlock for the next poll
        startBlock = await celoProvider.getBlockNumber();
    }, 10000); // Poll every 10 seconds
}

// Start polling for transfers
pollTransfers();
