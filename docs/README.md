# Sistema de Monitorização e Histórico de Qualidade do Ar (AQI)

Este projeto foi desenvolvido no âmbito da disciplina de Desenvolvimento de Aplicações Web. Consiste numa API RESTful que consome dados públicos de qualidade do ar, processa-os e armazena-os localmente, expondo-os através de endpoints documentados.

**Autores**:
- José Victor Gonçalves dos Santos: a56278@ualg.pt
- Afonso Montalvão: a79309@ualg.pt

---

## Instruções de Instalação e Execução

Siga estes passos para colocar o sistema em funcionamento na sua máquina local.

### 1. Pré-requisitos
* **Node.js** (v14 ou superior)
* **NPM** (Gestor de pacotes do Node)
* **Git** (Opcional, caso clone o repositório)

### 2. Instalação
Abra o terminal na pasta raiz do projeto e execute:

```bash
npm install
```

### 3. Configuração (.env)
Crie um ficheiro `.env` na raiz do projeto e configure as seguintes variáveis:

```ini
PORT=3000
# Chave para consumir a API externa (JuheAPI)
JUHE_API_KEY=a_tua_chave_juhe_aqui
# Chave Mestra para autenticação na TUA API Local (para testes)
ADMIN_API_KEY=chave_mestra_para_testes
```

> **Nota:** Se não tiver uma chave JuheAPI, o sistema irá iniciar, mas a sincronização de dados falhará.

### 4. Executar a Aplicação
Para iniciar o servidor:

```bash
node server.js
```

Deverá ver a seguinte mensagem no terminal:
`🚀 Servidor a correr na porta 3000`

### 5. Documentação e Testes (Swagger)
Com o servidor a correr, aceda à documentação interativa para testar os endpoints:

👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

*Para testar endpoints protegidos no Swagger, clique em "Authorize" e use a chave: `chave_mestra_para_testes`.*

### 6. Gestão de Chaves (Primeiros Passos)
O sistema arranca sem clientes registados (exceto se configurado manualmente). Para usar a API, deve primeiro gerar uma API Key de Cliente usando a sua Chave de Admin:

1. Faça um POST para `/api/admin/generate-key`.
2. Header `x-api-key`: use o valor de `ADMIN_API_KEY` do seu `.env`.
3. Body: `{ "client_name": "O Meu Cliente" }`.
4. Use a chave retornada (`api_key`) para fazer pedidos aos outros endpoints.

---

# Documento de Desenho e Arquitetura (Fase 2)

**Data:** 30/11/2025

## 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura de **Microsserviços** (implementada como um serviço modular em Node.js), funcionando como uma camada intermédia entre o fornecedor de dados público (JuheAPI) e os clientes finais. O objetivo é garantir a persistência histórica, o processamento de dados e o controlo de acesso.

### Componentes Principais:
1. **Fonte de Dados Externa (JuheAPI):** Fornece dados em tempo real sobre a qualidade do ar.
2. **Serviço Backend (Node.js):**
   * **Scheduler (Cron):** Responsável pela sincronização periódica.
   * **Controller/Service:** Lógica de negócio, validação e orquestração.
   * **API REST:** Interface para consumo externo.
3. **Armazenamento (SQLite):** Base de dados relacional local.

---

## 2. Processos de Fluxo de Dados

O diagrama abaixo ilustra as interações sequenciais entre o Administrador, o Cliente, o Sistema (Backend) e a API Externa para os principais casos de uso.

![Diagrama de Sequência](docs/diagrams/out/sequence_diagram/sequence_diagram.png)

### 2.1. Fluxo de Sincronização (Ingestão de Dados)
Este processo é automático e garante que a base de dados local mantém um histórico contínuo.

1. **Gatilho (Scheduler):** O módulo `node-cron` executa uma tarefa a cada hora (ex: `0 * * * *`).
2. **Leitura de Configuração:** O sistema consulta a tabela local `monitored_cities` para obter os nomes das cidades a processar, verificando se estão marcadas como ativas (`is_active = 1`).
3. **Requisição Externa:**
   * Endpoint: `GET https://hub.juheapi.com/aqi/v1/city`
   * Parâmetros: `q={nome_cidade}` e `apikey={JUHE_API_KEY}`.
4. **Processamento e Mapeamento:**
   * O sistema recebe o objeto `data`.
   * **Filtragem:** Verifica se a resposta é válida.
   * **Achatamento (Flattening):** Extrai `lat` e `lon` do objeto `geo` para colunas individuais.
   * **Cálculo Local:** Gera o campo `aqi_category` com base no valor de `aqi` (ex: 0-50 = "Bom", >150 = "Insalubre").
5. **Persistência:** Insere um novo registo na tabela `aqi_readings` com todos os poluentes (`co`, `no2`, `o3`, `pm10`, `pm25`, `so2`).

---

### 2.2. Fluxo de Exposição (Consumo via API REST)

1. **Autenticação:** O cliente envia um pedido com o header `x-api-key`. O middleware valida a chave na tabela `api_keys` comparando hashes SHA-256.
2. **Consulta (Read):** O endpoint (ex: `GET /readings/history`) aceita filtros de data.
3. **Manipulação (Update/Create):** O cliente pode anotar registos existentes (ex: adicionar observações sobre o clima local) ou inserir medições manuais.
4. **Resposta:** Os dados são retornados em formato JSON padronizado.

---

## 3. Modelo de Dados (SQLite)

O esquema de dados foi desenhado para armazenar todos os campos fornecidos pela API externa, mantendo a integridade relacional.

### 3.1. Tabela: `monitored_cities`
Armazena as configurações das cidades que o sistema deve vigiar.

```sql
CREATE TABLE monitored_cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_query VARCHAR(100) NOT NULL UNIQUE, -- O termo usado no param 'q' (ex: "london")
    display_name VARCHAR(100),                 -- Nome amigável (ex: "Londres - Sede")
    is_active BOOLEAN DEFAULT 1,               -- Controlo para o Scheduler
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2. Tabela: `aqi_readings`
Armazena o histórico completo e os dados processados. O objeto `geo` da API é armazenado como colunas `latitude` e `longitude`.

```sql
CREATE TABLE aqi_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_id INTEGER NOT NULL,
    
    -- Dados Principais
    aqi INTEGER,
    aqi_category VARCHAR(50),  -- Campo processado localmente (ex: "Moderado")
    
    -- Poluentes (Dados Brutos da API)
    co DECIMAL(10, 2),
    no2 DECIMAL(10, 2),
    o3 DECIMAL(10, 2),
    pm10 DECIMAL(10, 2),
    pm25 DECIMAL(10, 2),
    so2 DECIMAL(10, 2),
    
    -- Geolocalização (Do objeto 'geo')
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    
    -- Metadados do Sistema
    measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_notes TEXT,           -- Campo para operações de Update (CRUD)
    
    FOREIGN KEY(city_id) REFERENCES monitored_cities(id) ON DELETE CASCADE
);
```

### 3.3. Tabela: `api_keys`
Gere o acesso seguro à API REST local.

```sql
CREATE TABLE api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name VARCHAR(100),
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- Hash da chave para segurança
    is_active BOOLEAN DEFAULT 1
);
```

![Diagrama ERD](docs/diagrams/out/db_erd/db_erd.png)

---

## 4. Modelo de Segurança 
O sistema implementa segurança hierárquica:

**Nível Admin (Backoffice):**
- Controlado pela variável de ambiente `ADMIN_API_KEY`.
- Permite acesso exclusivo à rota `/api/admin/*` para gestão de chaves (gerar e remover).

**Nível Cliente (Consumidor):**
- Controlado por chaves geradas (UUIDs), cujos hashes (SHA-256) são armazenados na tabela `api_keys`.
- Permite acesso aos recursos de dados (Cidades, Leituras).

**Segurança de Origem:**
- A chave da JuheAPI nunca é exposta.

---

## 5. Interface da API REST (Especificação)

### 5.1. Administração

**POST /admin/generate-key** Gera uma nova chave para um cliente. Requer `ADMIN_API_KEY`.  
Body: `{ "client_name": "Nome do Cliente" }`

**DELETE /admin/api-keys/:id** Remove uma API Key existente por ID (revoga o acesso do cliente). Requer `ADMIN_API_KEY`.

---

### 5.2. Configuração (Cidades) e Estatísticas

**POST /cities** Regista uma nova cidade e força sincronização imediata.  
Body: `{ "search_query": "london", "display_name": "Londres" }`

**GET /cities** Lista todas as cidades configuradas e o seu estado (ativa/inativa).

**PATCH /cities/:id/active** Ativa ou desativa a monitorização automática de uma cidade.  
Body: `{ "is_active": false }`

**GET /cities/top/best** Retorna as 3 cidades com a melhor qualidade do ar (menor índice AQI) com base na última leitura registada.

**GET /cities/top/worst** Retorna as 3 cidades com a pior qualidade do ar (maior índice AQI) com base na última leitura registada.

---

### 5.3. Dados (Leituras)

**GET /cities/readings** Obtém histórico de qualidade do ar de todas as cidades monitorizadas.  
Query Params (opcionais):
- `start_date` (ex: 2025-01-01)
- `end_date` (ex: 2025-01-31)
- `limit` (padrão: 100)

**GET /cities/:city_id/readings** Obtém histórico de qualidade do ar de uma cidade específica.  
Query Params (opcionais):
- `start_date` (ex: 2025-01-01)
- `end_date` (ex: 2025-01-31)
- `limit` (padrão: 100)

**PATCH /readings/:reading_id** Adiciona notas a uma leitura.  
Body: `{ "user_notes": "Anomalia detectada." }`

**DELETE /readings/:reading_id** Remove uma leitura específica do histórico.