
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import express, { Application,Request, Response } from 'express';

const app: Application = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());

// Get all cards
app.get('/cards', async (req, res) => {
  try {
    const cards = await prisma.cards.findMany({
      select: {
        id: true,
        name: true,
        number: true,
      },
    });
    res.json(cards);
  } catch (error) {
    if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "An unknown error occurred" });
      }
  }
});

// Create a new card
app.post('/cards', async (req, res) => {
  const { name, number, cvv } = req.body;
  try {
    const card = await prisma.cards.create({
      data: { name, number, cvv },
    });
    res.json(card);
  } catch (error) {
    if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "An unknown error occurred" });
      }
  }
});

// Get all subscriptions
app.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await prisma.subscriptions.findMany({
      include: {
        card: true,
      },
    });
    res.json(subscriptions);
  } catch (error) {
    if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "An unknown error occurred" });
      }
  }
});

// Create a new subscription
app.post('/subscriptions', async (req, res) => {
  const { name, price, cardId } = req.body;

  try {
    const subscription = await prisma.subscriptions.create({
      data: {
        name,
        price: parseFloat(price),
        card: { connect: { id: cardId } },
      },
    });
    res.json(subscription);
  } catch (error) {
    if (error instanceof Error) {
        console.error('Detailed Error:', error);
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "An unknown error occurred" });
      }
  }
});

app.post('/payments', async (req, res):Promise<any> => {
    const { payments } = req.body;
    try {
    
      if (!Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({ error: 'Invalid payment data' });
      }
  
      for (const payment of payments) {
        await prisma.payment.create({
          data: {
            subscriptionid:payment.subscriptionid,
            subscriptionName: payment.subscriptionName,
            cardId: payment.cardId,
            cardName: payment.cardName,
            cardNumber: payment.cardNumber,
            price: payment.price,
          },
        });
     }


      return res.status(200).json({
        message: 'Payments processed successfully',
        
      });;
    } catch (error) {
      console.error('Error processing payments:', error);
      return res.status(500).json({ error: 'Failed to process payments' });
    }
  });


  async function processPayments() {
    try {
      
      const payments = await prisma.payment.findMany({
        where: { pay: false }, 
        include: { card: true },
      });
  
      for (const payment of payments) {
        const card = await prisma.cards.findUnique({
          where: { id: payment.cardId },
        });
  
        if (!card) continue; 
  
        if (card.amount >= payment.price) {
          
          const newAmount = card.amount - payment.price;
          console.log(`Processing Payment ID: ${payment.id}, New Amount: ${newAmount}`);
  
          await prisma.cards.update({
            where: { id: card.id },
            data: { amount: newAmount },
          });
  
          
          await prisma.payment.update({
            where: { id: payment.id },
            data: { pay: true }, 
          });
  
        } else {
          
          const newCard = await prisma.cards.findFirst({
            where: { amount: { gte: payment.price } },
            orderBy: { amount: 'desc' },
          });
  
          if (newCard) {
            console.log(`Switching Payment ID: ${payment.id} to New Card ID: ${newCard.id}`);
  
            
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                cardId: newCard.id,
                cardName: newCard.name,
                cardNumber: newCard.number,
              },
            });
  
           
            await prisma.subscriptions.update({
              where: { id: payment.subscriptionid },
              data: { cardId: newCard.id },
            });
  
            
            const newAmount = newCard.amount - payment.price;
            await prisma.cards.update({
              where: { id: newCard.id },
              data: { amount: newAmount },
            });
  
            
            await prisma.payment.update({
              where: { id: payment.id },
              data: { pay: true }, 
            });
          }
        }
      }
  
      console.log('Payment processing complete.');
    } catch (error) {
      console.error('Error processing payments:', error);
    }
  }
  

  
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
