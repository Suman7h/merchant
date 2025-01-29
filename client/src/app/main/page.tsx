"use client";

import { useState,useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function Mains() {
    const [cards, setCards] = useState<{ id: number; name: string; number: string; cvv: string; }[]>([]);
    const [subscriptions, setSubscriptions] = useState<{
      id: number;
      name: string;
      price: string; 
      card: {
        id: number;
        name: string;
        number: string;
      } | null; 
    }[]>([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [newCard, setNewCard] = useState({ name: '', number: '', cvv: '' });
  const [newSubscription, setNewSubscription] = useState({ name: '', price: '', card: 0 });

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCard((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubscriptionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSubscription((prev) => ({ ...prev, [name]: name === 'card' ? Number(value) : value }));
  };

  const saveCard =async () => {
    try {
      const response = await axios.post('http://localhost:5001/cards', newCard);
      setCards((prev) => [...prev, response.data]);
      setNewCard({ name: '', number: '', cvv: '' });
      setShowCardForm(false);
    } catch (error) {
      console.error("Error saving card:", error);
    }
  };

  const saveSubscription = async () => {
    try {
      
      const response = await axios.post('http://localhost:5001/subscriptions', {
        name: newSubscription.name,
        price: newSubscription.price, 
        cardId: newSubscription.card, 
      });
      const card = cards.find((card) => card.id === newSubscription.card);
      const newSubWithCard = { ...response.data, card };
      setSubscriptions((prev) => [...prev, newSubWithCard]);
      setNewSubscription({ name: '', price: '', card: 0 });
      setShowSubscriptionForm(false);
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };
  const makePayment = async () => {
    try {
      
      const paymentData = subscriptions.map((subscription) => {
        const card = cards.find((card) => card.id === subscription.card?.id);
  
        if (!card) {
          throw new Error(`Card not found for subscription: ${subscription.name}`);
        }
  
        return {
          subscriptionid:subscription.id,
          subscriptionName: subscription.name, 
          price: subscription.price,           
          cardId: card.id,                     
          cardName: card.name,                 
          cardNumber: card.number,             
        };
      });
  
      console.log('Payment Data to Send:', paymentData);
  
     
      const response = await axios.post('http://localhost:5001/payments', {
        payments: paymentData, 
      });
      
  
      alert('Payments processed successfully!');
      fetchData()

  
    } catch (error) {
      console.error('Error processing payments:', error);
      alert('Failed to process payments.');
    }
  };
  const fetchData = async () => {
    try {
      console.log('Fetching cards from API...');
      const cardResponse = await axios.get('http://127.0.0.1:5001/cards');
      const subscriptionResponse = await axios.get('http://127.0.0.1:5001/subscriptions');
      setCards(cardResponse.data);
      setSubscriptions(subscriptionResponse.data);
      console.log(subscriptionResponse)
    } catch (error) {
      console.error("Error fetching data:", error);
      
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
      <div className="bg-white p-4 rounded-lg shadow w-full max-w-4xl">
        <h2 className="text-lg font-bold mb-4">Subscriptions</h2>
        <ul>
          {subscriptions.map((sub) => (
            <li key={sub.id} className="mb-2 flex justify-between">
              <span>{sub.name} - ${sub.price}</span>
              <span>
              {sub.card
              ? `${sub.card.name} - **** ${sub.card.number.slice(-4)}`
              : 'No Card Assigned'}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center mt-4">
            <div className="flex justify-center gap-4">
                <Button onClick={() => setShowSubscriptionForm(true)}>Add Subscription</Button>
                <Button onClick={() => setShowCardForm(true)}>Add Card</Button>
            </div>
            <Button className="w-48 mt-4 flex justify-center"onClick={makePayment}>Make Payment</Button>
        </div>
      </div>

      {showCardForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <Card className="w-full max-w-md p-4">
            <CardContent>
              <h2 className="text-lg font-bold mb-4">Add Card</h2>
              <Input type="text" name="name" placeholder="Card Name" value={newCard.name} onChange={handleCardInputChange} className="mb-2" />
              <Input type="text" name="number" placeholder="Card Number" value={newCard.number} onChange={handleCardInputChange} className="mb-2" />
              <Input type="text" name="cvv" placeholder="CVV" value={newCard.cvv} onChange={handleCardInputChange} className="mb-4" />
              <Button onClick={saveCard} className="w-full mb-2">Save Card</Button>
              <Button onClick={() => setShowCardForm(false)} className="w-full">Cancel</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showSubscriptionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <Card className="w-full max-w-md p-4">
            <CardContent>
              <h2 className="text-lg font-bold mb-4">Add Subscription</h2>
              <Input type="text" name="name" placeholder="Subscription Name" value={newSubscription.name} onChange={handleSubscriptionInputChange} className="mb-2" />
              <Input type="text" name="price" placeholder="Price of Subscription" value={newSubscription.price} onChange={handleSubscriptionInputChange} className="mb-2" />
              <Select name="card" value={newSubscription.card.toString()} onValueChange={(value) => setNewSubscription((prev) => ({ ...prev, card: Number(value) }))}>
                 <SelectTrigger><SelectValue>{newSubscription.card ? cards.find((card) => card.id === newSubscription.card)?.name : 'Select Card'}</SelectValue></SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id.toString()}>{card.name} - **** {card.number.slice(-4)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={saveSubscription} className="w-full mb-2">Save Subscription</Button>
              <Button onClick={() => setShowSubscriptionForm(false)} className="w-full">Cancel</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}