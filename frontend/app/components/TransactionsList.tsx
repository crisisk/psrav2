interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  description: string;
}

export default async function TransactionsList() {
  try {
    const response = await fetch('/api/transactions', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const { transactions } = await response.json();

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Customer Transactions
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction: Transaction) => (
                <tr
                  key={transaction.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.customerId}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    €{transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (error) {
    console.error('[TRANSACTIONS_LIST]', error);
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        Error loading transactions: {(error as Error).message}
      </div>
    );
  }
}
