import { ChainId, NetworkUrl } from 'constants/contractConstants';
import { ethers } from 'ethers';
import ERC20_ABI from './ERC20_ABI.json';

export async function fetchBalances(validatedTokens: any, userAddress: string, chainId: ChainId) {
  interface TokenBalance {
    tokenAddress: string;
    balance: string;
  }
  const tokens = validatedTokens;
  const web3 = new ethers.providers.JsonRpcProvider(NetworkUrl[chainId]);

  try {
    const balances: TokenBalance[] = await Promise.all(
      tokens.map(async (tokenAddressInfo: any) => {
        try {
          const { address } = tokenAddressInfo;
          if (address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
            const balance = await web3.getBalance(userAddress);
            tokenAddressInfo.balance = ethers.utils.formatEther(balance);

            return {
              tokenAddress: address,
              balance: ethers.utils.formatEther(balance),
            };
          }

          // const contract = new web3.eth.Contract(ERC20_ABI as AbiItem[], address) as any;
          const contract = new ethers.Contract(address, ERC20_ABI, web3);

          const balance = await contract.balanceOf(userAddress);
          tokenAddressInfo.balance = ethers.utils.formatEther(balance);

          return {
            tokenAddress: address,
            balance: ethers.utils.formatEther(balance),
          };
        } catch (error) {
          console.error(`Error fetching balance for token ${tokenAddressInfo}:`, error);
          tokenAddressInfo.balance = 'Error fetching balance';
          return {
            tokenAddress: tokenAddressInfo.address,
            balance: 'Error fetching balance',
          };
        }
      })
    );

    // Sorted balances with tokens having balance > 0 on top

    const balancesObject: Record<string, string> = balances.reduce((acc, ele) => {
      acc[ele.tokenAddress] = ele.balance;
      return acc;
    }, {} as Record<string, string>);

    return balancesObject;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    throw error;
  }
}
