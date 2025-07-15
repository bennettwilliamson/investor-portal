"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import styles from './page.module.scss';

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface Banking {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
}

export default function ProfilePage() {
  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  const [banking, setBanking] = useState<Banking>({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
  });

  const handleAddressChange = (field: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [field]: e.target.value });
  };

  const handleBankChange = (field: keyof Banking) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setBanking({ ...banking, [field]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for saving logic
    alert('Profile saved');
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <h1>User Profile</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.section}>
            <h2>Address</h2>
            <div className={styles.field}> 
              <label htmlFor="street">Street</label>
              <input id="street" type="text" value={address.street} onChange={handleAddressChange('street')} />
            </div>
            <div className={styles.field}> 
              <label htmlFor="city">City</label>
              <input id="city" type="text" value={address.city} onChange={handleAddressChange('city')} />
            </div>
            <div className={styles.field}> 
              <label htmlFor="state">State</label>
              <input id="state" type="text" value={address.state} onChange={handleAddressChange('state')} />
            </div>
            <div className={styles.field}> 
              <label htmlFor="zip">ZIP</label>
              <input id="zip" type="text" value={address.zip} onChange={handleAddressChange('zip')} />
            </div>
          </section>

          <section className={styles.section}>
            <h2>Banking Information</h2>
            <div className={styles.field}> 
              <label htmlFor="bankName">Bank Name</label>
              <input id="bankName" type="text" value={banking.bankName} onChange={handleBankChange('bankName')} />
            </div>
            <div className={styles.field}> 
              <label htmlFor="accountNumber">Account Number</label>
              <input id="accountNumber" type="text" value={banking.accountNumber} onChange={handleBankChange('accountNumber')} />
            </div>
            <div className={styles.field}> 
              <label htmlFor="routingNumber">Routing Number</label>
              <input id="routingNumber" type="text" value={banking.routingNumber} onChange={handleBankChange('routingNumber')} />
            </div>
          </section>

          <button className={styles.saveButton} type="submit">Save</button>
        </form>
      </main>
    </>
  );
}
