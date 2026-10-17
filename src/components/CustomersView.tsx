import React from 'react';
import { CustomersPage } from '../pages/CustomersPage';
import type { Customer } from '../types';

interface CustomersViewProps {
  onOpenAddCustomer: () => void;
  onSelectCustomerForBill?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = (props) => {
  return <CustomersPage {...props} />;
};
