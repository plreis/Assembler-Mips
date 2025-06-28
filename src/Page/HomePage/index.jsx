import { useState } from 'react';

export const HomePage = () => {
  const [codigo, setCodigo] = useState('');
  const [binario, setBinario] = useState('');

  const registerMap = {
    '$zero': 0, '$t0': 8, '$t1': 9, '$t2': 10,
    '$t3': 11, '$s0': 16, '$s1': 17
  };

  function toBinary(num, length) {
    if (num < 0) {
      return (num >>> 0).toString(2).padStart(32, '0').slice(-length);
    }
    return num.toString(2).padStart(length, '0');
  }

  function assembleInstruction(instruction) {
    const clean = instruction.replace(/,/g, '');
    const tokens = clean.split(' ');
    const instruc = tokens[0];

    if (['add', 'sub', 'mult', 'and', 'or', 'slt'].includes(instruc)) {
      const [_, rd, rs, rt] = tokens;
      const opcode = '000000';
      const rsBin = toBinary(registerMap[rs], 5);
      const rtBin = toBinary(registerMap[rt], 5);
      const rdBin = toBinary(registerMap[rd], 5);
      const shamt = '00000';

      const functMap = {
        add: '100000', sub: '100010', mult: '011000',
        and: '100100', or: '100101', slt: '101010'
      };

      const funct = functMap[instruc];
      return `${opcode}${rsBin}${rtBin}${rdBin}${shamt}${funct}`;
    }

    if (['addi', 'slti'].includes(instruc)) {
      const [_, rt, rs, imm] = tokens;
      const opcodeMap = { addi: '001000', slti: '001010' };
      const opcode = opcodeMap[instruc];
      const rsBin = toBinary(registerMap[rs], 5);
      const rtBin = toBinary(registerMap[rt], 5);
      const immBin = toBinary(parseInt(imm), 16);
      return `${opcode}${rsBin}${rtBin}${immBin}`;
    }

    if (['lw', 'sw'].includes(instruc)) {
      const [_, rt, offsetRs] = tokens;
      const match = offsetRs.match(/(-?\d+)\((\$\w+)\)/);
      if (!match) return 'Erro no formato lw/sw';

      const offset = parseInt(match[1]);
      const rs = match[2];
      const opcode = instruc === 'lw' ? '100011' : '101011';
      const rsBin = toBinary(registerMap[rs], 5);
      const rtBin = toBinary(registerMap[rt], 5);
      const offsetBin = toBinary(offset, 16);
      return `${opcode}${rsBin}${rtBin}${offsetBin}`;
    }

    if (instruc === 'lui') {
      const [_, rt, imm] = tokens;
      const opcode = '001111';
      const rsBin = '00000';
      const rtBin = toBinary(registerMap[rt], 5);
      const immBin = toBinary(parseInt(imm), 16);
      return `${opcode}${rsBin}${rtBin}${immBin}`;
    }

    return 'Instrução não suportada';
  }

  function handleSubmit() {
    const bin = assembleInstruction(codigo);
    setBinario(bin);
  }

  return (
    <>
      <header>
        <h1>Mini Simulador MIPS</h1>
      </header>

      <section>
        <label>Código Assembly</label>
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <button onClick={handleSubmit}>Submit</button>
      </section>

      <section>
        <label>Binário gerado</label>
        <input type="text" readOnly value={binario} />
      </section>
    </>
  );
};
