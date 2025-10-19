import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'dvivd-consultancy';

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.email && !data.phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
    }
    const client = await connectToDatabase();
    const db = client.db(dbName);
    const leads = db.collection('leads');

    // Check for existing lead by email or phone
    const query = [];
    if (data.email) query.push({ email: data.email });
    if (data.phone) query.push({ phone: data.phone });
    const existing = await leads.findOne({ $or: query });

    if (existing) {
      // Optionally update existing lead
      await leads.updateOne({ _id: existing._id }, { $set: data });
      return NextResponse.json({ updated: true });
    } else {
      await leads.insertOne(data);
      return NextResponse.json({ created: true });
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
