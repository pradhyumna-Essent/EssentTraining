
export interface Deposit {
    SimulatedDayDeposit: number;
    id: string;
    amount: number;
    simulatedDayDeposit: number;
    depositdate: Date;
  }
  
  export interface Purchases {
    SimulatedDayPurchase: any;
    productId: string;
    simulatedDayPurchase: number;
  }

export interface Account {
    id: string;
    name: string;
    balance: number;
    depositDetails?: Deposit[];
    purchaseDetails?: Purchases[];
  }
  
  export interface AccontResponse {
    id: string;
    name: string;
    balance: number;
  }
