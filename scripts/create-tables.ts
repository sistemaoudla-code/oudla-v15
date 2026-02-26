import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function createTables() {
  console.log('🏗️  Criando tabelas...\n');

  try {
    // Create products table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text NOT NULL,
        price decimal(10, 2) NOT NULL,
        original_price decimal(10, 2),
        product_type varchar(50) DEFAULT 'tshirt',
        category text,
        colors text,
        sizes text[],
        model_url text,
        is_new boolean DEFAULT false,
        is_active boolean DEFAULT true,
        display_order integer DEFAULT 0,
        customizable_front boolean DEFAULT false,
        customizable_back boolean DEFAULT false,
        fabric_tech text[],
        fabric_description text,
        care_instructions text,
        size_guide text,
        rating decimal(2, 1) DEFAULT 4.5,
        reviews_count integer DEFAULT 0,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela products criada');

    // Create product_images table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS product_images (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id varchar NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url text NOT NULL,
        alt_text text,
        image_type varchar(20) DEFAULT 'carousel',
        color text,
        sort_order integer DEFAULT 0,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela product_images criada');

    // Create admin_users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        username text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        is_active boolean DEFAULT true,
        last_login timestamp,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela admin_users criada');

    console.log('\n🎉 Todas as tabelas foram criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
}

createTables().catch(console.error).finally(() => process.exit());
