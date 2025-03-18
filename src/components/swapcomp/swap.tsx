
import { useState, useEffect } from "react";
import { ArrowDownUp } from "lucide-react";
import { NETWORKS, SLIPPAGE_OPTIONS } from "@/lib/constants";
import { Network, Token, SwapState } from "@/lib/types";
import NetworkSelector from "@/components/NetworkSelector";
import SwapInput from "@/components/swapcomp/swapInput";
import SlippageComponent from "@/components/swapcomp/slippage_component";
import TransactionHistory, { Transaction } from "@/components/swapcomp/TransactionHistory";
import { useWallet } from "@/context/walletContext";
import { useNetwork } from "@/context/networkContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchSymbiosisTokens } from "@/services/tokenService";
import { swapTokens, calculateOutputAmount } from "@/lib/swap";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const Swap = () => {
  const { isConnected, connect, selectedWallet, address } = useWallet();
  const { isTestnet } = useNetwork();
  const isMobile = useIsMobile();
  
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  
  const [swapState, setSwapState] = useState<SwapState>({
    fromToken: null,
    toToken: null,
    fromAmount: '',
    toAmount: '',
    slippage: 0.5,
  });
  
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const [isPairSupported, setIsPairSupported] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const savedTxs = localStorage.getItem('swapTransactions');
    return savedTxs ? JSON.parse(savedTxs) : [];
  });
  
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoadingTokens(true);
      try {
        console.log(`Loading tokens for network: ${selectedNetwork.id}, testnet: ${isTestnet}`);
        const tokens = await fetchSymbiosisTokens(selectedNetwork.id, isTestnet);
        console.log(`Loaded ${tokens.length} tokens`);
        setAvailableTokens(tokens);
        
        setSwapState(prev => ({
          ...prev,
          fromToken: null,
          toToken: null,
          fromAmount: '',
          toAmount: '',
        }));
        
        toast.info(`Switched to ${isTestnet ? 'Testnet' : 'Mainnet'} on ${selectedNetwork.name}`);
      } catch (error) {
        console.error("Error loading tokens:", error);
        toast.error("Failed to load tokens. Please try again later.");
      } finally {
        setIsLoadingTokens(false);
      }
    };
    
    loadTokens();
  }, [selectedNetwork, isTestnet]);
  
  useEffect(() => {
    localStorage.setItem('swapTransactions', JSON.stringify(transactions));
  }, [transactions]);
  
  useEffect(() => {
    const getQuote = async () => {
      if (swapState.fromToken && swapState.toToken && swapState.fromAmount && parseFloat(swapState.fromAmount) > 0) {
        try {
          console.log("Getting quote for:", {
            fromToken: `${swapState.fromToken.symbol} (${swapState.fromToken.chainId})`,
            toToken: `${swapState.toToken.symbol} (${swapState.toToken.chainId})`,
            amount: swapState.fromAmount
          });
          
          const calculatedAmount = await calculateOutputAmount(
            swapState.fromToken,
            swapState.toToken,
            swapState.fromAmount,
            address,
            isTestnet
          );
          
          console.log(`Calculated output amount: ${calculatedAmount}`);
          setSwapState(prev => ({ ...prev, toAmount: calculatedAmount }));
          
          setIsPairSupported(true);
        } catch (error) {
          console.error("Error getting swap quote:", error);
          
          const errorMsg = (error as Error).message || '';
          if (errorMsg.includes('not supported')) {
            setIsPairSupported(false);
            toast.error("This token pair is not supported for swapping");
          } else {
            toast.error(`Quote error: ${errorMsg}`);
            setIsPairSupported(true);
          }
          
          if (swapState.fromToken.price && swapState.toToken.price) {
            const fromPrice = swapState.fromToken.price || 1;
            const toPrice = swapState.toToken.price || 1;
            const inputAmount = parseFloat(swapState.fromAmount);
            const outputAmount = (inputAmount * fromPrice) / toPrice;
            
            setSwapState(prev => ({ 
              ...prev, 
              toAmount: outputAmount.toFixed(swapState.toToken.decimals || 6)
            }));
          } else {
            setSwapState(prev => ({ ...prev, toAmount: '0' }));
          }
        }
      } else if (!swapState.fromAmount || parseFloat(swapState.fromAmount) <= 0) {
        setSwapState(prev => ({ ...prev, toAmount: '' }));
      }
    };
    
    getQuote();
  }, [swapState.fromToken, swapState.toToken, swapState.fromAmount, address, isTestnet]);
  
  const handleSwap = async () => {
    if (!swapState.fromToken || !swapState.toToken || !swapState.fromAmount) {
      toast.error("Please select tokens and enter an amount to swap");
      return;
    }
    
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsSwapping(true);
    setTxStatus('pending');
    
    try {
      const txId = Date.now().toString();
      const newTx: Transaction = {
        id: txId,
        timestamp: Date.now(),
        fromToken: {
          symbol: swapState.fromToken.symbol,
          amount: swapState.fromAmount
        },
        toToken: {
          symbol: swapState.toToken.symbol,
          amount: swapState.toAmount
        },
        status: 'pending',
        network: selectedNetwork.name + (isTestnet ? ' Testnet' : ' Mainnet'),
      };
      
      setTransactions(prev => [newTx, ...prev]);
      
      const success = await swapTokens(
        swapState.fromToken,
        swapState.toToken,
        swapState.fromAmount,
        swapState.slippage,
        address,
        isTestnet
      );
      
      if (success) {
        setTxStatus('success');
        
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === txId 
              ? { 
                  ...tx, 
                  status: 'success',
                  blockExplorerUrl: selectedNetwork?.blockExplorer 
                    ? `https://${isTestnet ? 'testnet.' : ''}${selectedNetwork.blockExplorer}/tx/${success}` 
                    : undefined
                } 
              : tx
          )
        );
        
        setTimeout(() => {
          setSwapState(prev => ({
            ...prev,
            fromAmount: '',
            toAmount: '',
          }));
          setTxStatus(null);
        }, 5000);
      } else {
        setTxStatus('error');
        
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === txId ? { ...tx, status: 'failed' } : tx
          )
        );
        
        setTimeout(() => {
          setTxStatus(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Swap error:", error);
      setTxStatus('error');
      
      setTransactions(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0] = { ...updated[0], status: 'failed' };
        }
        return updated;
      });
      
      toast.error(`Swap failed: ${(error as Error).message}`);
      setTimeout(() => {
        setTxStatus(null);
      }, 5000);
    } finally {
      setIsSwapping(false);
    }
  };
  
  const handleSwitchTokens = () => {
    if (!swapState.fromToken || !swapState.toToken) return;
    
    setSwapState(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }));
  };
  
  return (
    <div className="space-y-4 px-2 sm:px-0">
      <Card className="swap-card w-full max-w-[480px] mx-auto">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
            <NetworkSelector 
              selectedNetwork={selectedNetwork} 
              onSelectNetwork={setSelectedNetwork} 
            />
            
            <div className="flex items-center gap-2">
              {isTestnet && (
                <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
                  Testnet
                </span>
              )}
              <div className="flex items-center">
                <span className="text-white text-xs whitespace-nowrap mr-2">Slippage Fee:</span>
                <Popover open={showSettings} onOpenChange={setShowSettings}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="settings-button bg-black/20 border-unikron-blue/20 text-white h-8 px-3"
                    >
                      <span className="text-xs font-medium">{swapState.slippage}%</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 bg-unikron-navy-light border-unikron-blue/20">
                    <SlippageComponent
                      slippage={swapState.slippage}
                      setSlippage={(value) => setSwapState(prev => ({ ...prev, slippage: value }))}
                      slippageOptions={SLIPPAGE_OPTIONS}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <SwapInput
              label="From"
              selectedToken={swapState.fromToken}
              onSelectToken={(token) => 
                setSwapState(prev => ({ ...prev, fromToken: token }))
              }
              amount={swapState.fromAmount}
              onAmountChange={(amount) => 
                setSwapState(prev => ({ ...prev, fromAmount: amount }))
              }
              availableTokens={availableTokens}
              isLoading={isLoadingTokens}
            />
            
            <div className="flex justify-center -my-3 relative z-10">
              <button 
                onClick={handleSwitchTokens}
                className="swap-connector"
                disabled={!swapState.fromToken || !swapState.toToken}
              >
                <ArrowDownUp className="h-4 w-4" />
              </button>
            </div>
            
            <SwapInput
              label="To"
              selectedToken={swapState.toToken}
              onSelectToken={(token) => 
                setSwapState(prev => ({ ...prev, toToken: token }))
              }
              amount={swapState.toAmount}
              onAmountChange={(amount) => 
                setSwapState(prev => ({ ...prev, toAmount: amount }))
              }
              availableTokens={availableTokens}
              isLoading={isLoadingTokens}
              isReadOnly={true}
            />
          </div>
          
          {!isPairSupported && swapState.fromToken && swapState.toToken && (
            <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-300 text-sm">
              This token pair may not be supported for swapping via Symbiosis, but we'll try a fallback method.
            </div>
          )}
          
          <div className="mt-6">
            <Button 
              className="w-full py-5 sm:py-6 text-base sm:text-lg font-medium"
              disabled={!swapState.fromToken || !swapState.toToken || !swapState.fromAmount || isSwapping}
              onClick={isConnected ? handleSwap : () => {
                if (selectedWallet) {
                  connect(selectedWallet);
                } else {
                  toast.info("Please connect a wallet first");
                }
              }}
            >
              {!isConnected 
                ? "Connect Wallet" 
                : isSwapping 
                  ? "Swapping..." 
                  : txStatus === 'success' 
                    ? "Swap Successful" 
                    : "Swap"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <TransactionHistory transactions={transactions} />
    </div>
  );
};

import { ethers } from 'ethers';

export default Swap;
