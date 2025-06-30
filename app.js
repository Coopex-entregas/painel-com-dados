let totalColetas = 0;
let totalEntregas = 0;
let totalParadas = 0;

function criarBlocoEndereco(tipo, index) {
  return `
    <div class="bloco-endereco">
      <label>CEP (opcional):</label>
      <input type="text" id="cep${tipo}${index}" />
      <button type="button" onclick="buscarEndereco('${tipo}', ${index})">Buscar Endereço</button>
      <label>Rua:</label>
      <input type="text" id="rua${tipo}${index}" />
      <label>Número:</label>
      <input type="text" id="numero${tipo}${index}" />
      <label>Bairro:</label>
      <input type="text" id="bairro${tipo}${index}" />
      <label>Cidade:</label>
      <input type="text" id="cidade${tipo}${index}" />
      <label>Complemento:</label>
      <input type="text" id="complemento${tipo}${index}" />
      <label>Ponto de referência:</label>
      <input type="text" id="referencia${tipo}${index}" />
    </div>
  `;
}

function adicionarColeta() {
  if (totalColetas >= 3) return alert("Limite máximo de 3 endereços de coleta.");
  totalColetas++;
  document.getElementById("coleta-container").insertAdjacentHTML("beforeend", criarBlocoEndereco("Coleta", totalColetas));
}

function adicionarEntrega() {
  if (totalEntregas >= 20) return alert("Limite máximo de 20 endereços de entrega.");
  totalEntregas++;
  document.getElementById("entrega-container").insertAdjacentHTML("beforeend", criarBlocoEndereco("Entrega", totalEntregas));
}

function adicionarParada() {
  totalParadas++;
  document.getElementById("parada-container").insertAdjacentHTML("beforeend", criarBlocoEndereco("Parada", totalParadas));
}

function buscarEndereco(tipo, index) {
  const cep = document.getElementById(`cep${tipo}${index}`).value.replace(/\D/g, "");
  if (cep.length !== 8) {
    alert("Digite um CEP válido com 8 dígitos.");
    return;
  }
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(resp => resp.json())
    .then(data => {
      if (data.erro) {
        alert("CEP não encontrado.");
        return;
      }
      document.getElementById(`rua${tipo}${index}`).value = data.logradouro || "";
      document.getElementById(`bairro${tipo}${index}`).value = data.bairro || "";
      document.getElementById(`cidade${tipo}${index}`).value = data.localidade || "";
    })
    .catch(() => alert("Erro ao buscar o CEP."));
}

function mostrarOpcoesPagamento() {
  const pix = document.querySelector("input[value='Pix']");
  const dinheiro = document.querySelector("input[value='Dinheiro']");
  document.getElementById("mensagemPix").style.display = pix && pix.checked ? "block" : "none";
  document.getElementById("opcoesDinheiro").style.display = dinheiro && dinheiro.checked ? "flex" : "none";
}

function fazerLogin() {
  const nome = document.getElementById("loginNome").value.trim();
  const tel = document.getElementById("loginTelefone").value.trim();
  const endereco = document.getElementById("loginEndereco").value.trim();

  if (!nome || !tel || !endereco) {
    alert("Preencha todos os campos do login.");
    return;
  }

  localStorage.setItem("usuarioNome", nome);
  localStorage.setItem("usuarioTelefone", tel);
  localStorage.setItem("usuarioEndereco", endereco);

  document.getElementById("nomeSolicitante").value = nome;
  document.getElementById("telefoneSolicitante").value = tel;
  document.getElementById("enderecoColetaSalvo").value = endereco;

  document.getElementById("login-container").style.display = "none";
  document.getElementById("form-container").style.display = "block";
}

window.onload = () => {
  const nome = localStorage.getItem("usuarioNome");
  const tel = localStorage.getItem("usuarioTelefone");
  const endereco = localStorage.getItem("usuarioEndereco");

  if (nome && tel && endereco) {
    document.getElementById("nomeSolicitante").value = nome;
    document.getElementById("telefoneSolicitante").value = tel;
    document.getElementById("enderecoColetaSalvo").value = endereco;
    document.getElementById("login-container").style.display = "none";
    document.getElementById("form-container").style.display = "block";
  } else {
    document.getElementById("form-container").style.display = "none";
  }
};

// Funções auxiliares para coletar os dados
function coletarEnderecos(tipo) {
  let lista = [];
  let total = 0;
  if (tipo === "Coleta") total = totalColetas;
  else if (tipo === "Entrega") total = totalEntregas;
  else if (tipo === "Parada") total = totalParadas;

  for (let i = 1; i <= total; i++) {
    const cep = document.getElementById(`cep${tipo}${i}`)?.value || "";
    const rua = document.getElementById(`rua${tipo}${i}`)?.value || "";
    const numero = document.getElementById(`numero${tipo}${i}`)?.value || "";
    const bairro = document.getElementById(`bairro${tipo}${i}`)?.value || "";
    const cidade = document.getElementById(`cidade${tipo}${i}`)?.value || "";
    const complemento = document.getElementById(`complemento${tipo}${i}`)?.value || "";
    const referencia = document.getElementById(`referencia${tipo}${i}`)?.value || "";
    lista.push({ cep, rua, numero, bairro, cidade, complemento, referencia });
  }
  return lista;
}

function coletarTipoServico() {
  let servicos = [];
  document.querySelectorAll('input[type="checkbox"][name="tipoServico"]:checked').forEach(el => {
    servicos.push(el.value);
  });
  return servicos.join(", ");
}

function coletarFormaPagamento() {
  let pagamentos = [];
  document.querySelectorAll('input[type="checkbox"][name="formaPagamento"]:checked').forEach(el => {
    pagamentos.push(el.value);
  });
  return pagamentos.join(", ");
}

// Função principal para enviar pedido ao Apps Script e abrir WhatsApp
async function enviarPedido() {
  try {
    const cliente = document.getElementById("nomeSolicitante").value.trim();
    const telefone = document.getElementById("telefoneSolicitante").value.trim();
    const valor = document.getElementById("valorPedido") ? document.getElementById("valorPedido").value.trim() : "";

    if (!cliente || !telefone) {
      alert("Preencha nome e telefone do solicitante.");
      return;
    }

    // Montar dados para enviar
    const dadosParaSalvar = {
      dataPedido: new Date().toLocaleDateString("pt-BR"),
      horaPedido: new Date().toLocaleTimeString("pt-BR"),
      cliente,
      telefone,
      enderecoColeta: coletarEnderecos("Coleta"),
      enderecoEntrega: coletarEnderecos("Entrega"),
      tipoServico: coletarTipoServico(),
      formaPagamento: coletarFormaPagamento(),
      valor
    };

    // URL do seu Apps Script (substitua pelo seu link de implantação)
    const urlAppsScript = "https://script.google.com/macros/s/SEU_ID_AQUI/exec";

    // Envia os dados para o Apps Script
    const response = await fetch(urlAppsScript, {
      method: "POST",
      body: JSON.stringify(dadosParaSalvar),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const resultado = await response.json();

    if (resultado.result === "success") {
      alert("Pedido salvo com sucesso! Agora será aberto o WhatsApp para envio.");

      // Montar a mensagem para WhatsApp
      let mensagem = `*Novo Pedido COOPEX ENTREGAS*\n\n`;
      mensagem += `*Data do Pedido:* ${dadosParaSalvar.dataPedido}\n`;
      mensagem += `*Hora do Pedido:* ${dadosParaSalvar.horaPedido}\n`;
      mensagem += `*Cliente:* ${cliente}\n`;
      mensagem += `*Telefone:* ${telefone}\n\n`;

      mensagem += `*Endereços de Coleta:*\n`;
      dadosParaSalvar.enderecoColeta.forEach((e, i) => {
        mensagem += `Coleta ${i+1}: ${e.rua}, ${e.numero}, ${e.bairro}, ${e.cidade}, CEP: ${e.cep || "N/A"}\nComplemento: ${e.complemento || "N/A"}\nReferência: ${e.referencia || "N/A"}\n\n`;
      });

      mensagem += `*Endereços de Entrega:*\n`;
      dadosParaSalvar.end
