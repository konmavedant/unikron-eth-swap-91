
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export interface Transaction {
  id: string;
  timestamp: number;
  fromToken: {
    symbol: string;
    amount: string;
  };
  toToken: {
    symbol: string;
    amount: string;
  };
  status: 'success' | 'pending' | 'failed';
  network: string;
  blockExplorerUrl?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Calculate total pages
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  
  // Get current transactions
  const currentTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  const getStatusColor = (status: 'success' | 'pending' | 'failed') => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return '';
    }
  };
  
  if (transactions.length === 0) {
    return (
      <Card className="mt-4 bg-black/20 border-unikron-blue/20">
        <CardContent className="p-4">
          <p className="text-center text-white/60 py-6">No transaction history yet</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-4 bg-black/20 border-unikron-blue/20">
      <CardContent className="p-4">
        <h3 className="text-white text-lg mb-3">Transaction History</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-unikron-blue/20">
                <TableHead className="text-white/70">Time</TableHead>
                <TableHead className="text-white/70">From</TableHead>
                <TableHead className="text-white/70">To</TableHead>
                <TableHead className="text-white/70">Network</TableHead>
                <TableHead className="text-white/70">Status</TableHead>
                <TableHead className="text-white/70 text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTransactions.map((tx) => (
                <TableRow key={tx.id} className="border-unikron-blue/20">
                  <TableCell className="text-white/80">{formatDate(tx.timestamp)}</TableCell>
                  <TableCell className="text-white/80">
                    {tx.fromToken.amount} {tx.fromToken.symbol}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {tx.toToken.amount} {tx.toToken.symbol}
                  </TableCell>
                  <TableCell className="text-white/80">{tx.network}</TableCell>
                  <TableCell className={getStatusColor(tx.status)}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.blockExplorerUrl && (
                      <a
                        href={tx.blockExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-unikron-blue hover:text-unikron-blue-light inline-flex items-center"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={currentPage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
