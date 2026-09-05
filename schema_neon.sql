-- =====================================================================
-- EthnoVet Chat: PostgreSQL Database Schema for Neon.tech
-- Run this script in the Neon.tech SQL Editor
-- =====================================================================

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table (Farmers & Administrators)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Farmer',
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'en', -- 'en' or 'ta'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 3. Chat Sessions Table (Long-Term User Consultations)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL UNIQUE, -- matches client session key
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for anonymous guest
    title VARCHAR(150) NOT NULL DEFAULT 'New Consultation',
    persisted_animal VARCHAR(50),
    persisted_language VARCHAR(5) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_active ON chat_sessions(last_active_at DESC);

-- 4. Chat Messages Table (Every Multi-Turn Message Turn)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    relevant_remedies_json JSONB, -- stores RAG traditional remedies cited
    is_ai_generated BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp ASC);

-- 5. Disease Statistics & Lifetime Demand Aggregations
CREATE TABLE IF NOT EXISTS disease_analytics (
    id SERIAL PRIMARY KEY,
    disease_name VARCHAR(100) NOT NULL UNIQUE,
    query_count INT NOT NULL DEFAULT 1,
    last_queried_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disease_analytics_count ON disease_analytics(query_count DESC);

