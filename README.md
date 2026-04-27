# ALUNOS: Pedro Reis, André Nacamura

**[Acesse o simulador aqui → https://plreis.github.io/Assembler-Mips/](https://plreis.github.io/Assembler-Mips/)**

---

# Simulador de Processador MIPS

Simulador interativo para um subconjunto da arquitetura MIPS de 32 bits, desenvolvido com **Next.js 15**, **TypeScript** e **Tailwind CSS**. Permite escrever, montar e executar código Assembly MIPS em uma interface gráfica, visualizando em tempo real o estado dos registradores, a memória e a saída do programa.

O simulador é baseado no datapath clássico de ciclo único, implementando a decodificação e execução de instruções dos tipos R, I e J.

## Funcionalidades

- **Editor de código** com numeração de linhas e scroll sincronizado
- **Montador (Assembler):** converte Assembly em código de máquina de 32 bits, exibido no formato de campos MIPS (`op rs rt rd shamt funct`)
- **Controle de execução:**
  - **Passo a passo** — execute uma instrução por vez para depuração detalhada
  - **Rodar** — executa o programa inteiro automaticamente (200 ms por instrução)
  - **Pausar / Resetar** — controle total do fluxo
- **Visualização em tempo real:**
  - **Registradores** — todos os 32 registradores + HI e LO
  - **Memória (Data)** — endereço, valor em byte e caractere correspondente
  - **Instruções montadas** — instrução atual (PC) destacada
- **Caminho de dados (Datapath)** — diagrama visual da instrução em execução
- **Painel de referência MIPS** — tabela de instruções acessível na própria interface
- **Upload de arquivo** `.s` / `.txt` — carregue seu código direto do disco
- **Exemplos prontos** — Hello World, Multiplicação, Fatorial e Divisão
- **Relatório final** — exporta estado dos registradores e memória em `.txt`

## Instruções Suportadas

### Tipo R

| Instrução | Sintaxe | Descrição |
|-----------|---------|-----------|
| `add` | `add $rd, $rs, $rt` | Soma inteira com sinal |
| `sub` | `sub $rd, $rs, $rt` | Subtração com sinal |
| `mult` | `mult $rs, $rt` | Multiplicação → HI:LO |
| `div` | `div $rs, $rt` | Divisão → LO (quociente), HI (resto) |
| `mflo` | `mflo $rd` | Move LO para registrador |
| `mfhi` | `mfhi $rd` | Move HI para registrador |
| `and` | `and $rd, $rs, $rt` | AND bit a bit |
| `or` | `or $rd, $rs, $rt` | OR bit a bit |
| `sll` | `sll $rd, $rt, shamt` | Deslocamento à esquerda lógico |
| `slt` | `slt $rd, $rs, $rt` | Set on Less Than |
| `jr` | `jr $rs` | Jump Register |
| `syscall` | `syscall` | Chamada de sistema |

### Tipo I

| Instrução | Sintaxe | Descrição |
|-----------|---------|-----------|
| `addi` | `addi $rt, $rs, imm` | Soma com imediato com sinal |
| `ori` | `ori $rt, $rs, imm` | OR com imediato |
| `slti` | `slti $rt, $rs, imm` | Set on Less Than Immediate |
| `lui` | `lui $rt, imm` | Load Upper Immediate |
| `lw` | `lw $rt, offset($rs)` | Load Word da memória |
| `sw` | `sw $rt, offset($rs)` | Store Word na memória |
| `beq` | `beq $rs, $rt, label` | Branch if Equal |
| `bne` | `bne $rs, $rt, label` | Branch if Not Equal |

### Tipo J

| Instrução | Sintaxe | Descrição |
|-----------|---------|-----------|
| `j` | `j label` | Jump incondicional |
| `jal` | `jal label` | Jump and Link (salva retorno em `$ra`) |

### Pseudo-instruções

| Pseudo | Expansão | Descrição |
|--------|----------|-----------|
| `li $rt, imm` | `addi $rt, $zero, imm` (ou `lui` + `ori` para valores >16 bits) | Load Immediate |
| `la $rt, label` | `lui $rt, %hi(label)` + `ori $rt, $rt, %lo(label)` | Load Address |
| `move $rd, $rs` | `add $rd, $rs, $zero` | Cópia de registrador |
| `lw $rt, label` | `lui $at, %hi(label)` + `lw $rt, %lo(label)($at)` | Load Word por label |
| `sw $rt, label` | `lui $at, %hi(label)` + `sw $rt, %lo(label)($at)` | Store Word por label |

### Diretivas de Dados

| Diretiva | Exemplo | Descrição |
|----------|---------|-----------|
| `.asciiz` | `msg: .asciiz "Olá!\n"` | String terminada em nulo (suporta `\n`, `\t`, `\\`, `\"`) |
| `.word` | `num: .word 42` | Inteiro de 32 bits (aceita lista separada por vírgula) |

### Chamadas de Sistema (`syscall`)

| `$v0` | Serviço | Descrição |
|-------|---------|-----------|
| `1` | Imprimir Inteiro | Imprime o inteiro em `$a0` |
| `4` | Imprimir String | Imprime a string cujo endereço está em `$a0` |
| `10` | Sair | Finaliza a execução do programa |

## Exemplos de Código

### Olá, Mundo

```mips
.data
mensagem: .asciiz "Ola, Mundo!\n"

.text
main:
  la $a0, mensagem
  li $v0, 4
  syscall

  li $v0, 10
  syscall
```

### Fatorial de 5

```mips
.data
str_result: .asciiz "Fatorial de 5: "

.text
main:
  li $t0, 5      # N = 5
  li $t1, 1      # Resultado = 1

loop:
  beq $t0, $zero, end_loop
  mult $t1, $t0
  mflo $t1
  addi $t0, $t0, -1
  j loop

end_loop:
  la $a0, str_result
  li $v0, 4
  syscall

  add $a0, $t1, $zero
  li $v0, 1
  syscall

  li $v0, 10
  syscall
```

### Divisão com quociente e resto

```mips
.data
str_quo: .asciiz "Quociente: "
str_rem: .asciiz "\nResto: "

.text
main:
  li $t0, 17
  li $t1, 5
  div $t0, $t1
  mflo $t2       # Quociente
  mfhi $t3       # Resto

  la $a0, str_quo
  li $v0, 4
  syscall
  add $a0, $t2, $zero
  li $v0, 1
  syscall

  la $a0, str_rem
  li $v0, 4
  syscall
  add $a0, $t3, $zero
  li $v0, 1
  syscall

  li $v0, 10
  syscall
```

## Como Executar Localmente

### Pré-requisitos

- **Node.js 18+** — [nodejs.org](https://nodejs.org/)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/plreis/Assembler-Mips
cd Assembler-Mips

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

### Build de produção

```bash
npm run build   # Gera os arquivos estáticos em ./out
```

## Deploy (GitHub Pages)

O deploy é feito automaticamente via **GitHub Actions** a cada push na branch `main`. O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) realiza o build com `NODE_ENV=production` e publica a pasta `out/` no GitHub Pages.

Para ativar pela primeira vez:
1. Vá em **Settings → Pages** do repositório
2. Em **Source**, selecione **GitHub Actions**
3. Faça um push — o site será publicado em `https://plreis.github.io/Assembler-Mips/`

## Stack

| Tecnologia | Versão |
|------------|--------|
| Next.js | 15 (App Router) |
| React | 19 |
| TypeScript | 5.9 |
| Tailwind CSS | 4 |
| lucide-react | ícones |
| react-resizable-panels | painéis redimensionáveis |
| motion | animações |
