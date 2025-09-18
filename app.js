// ===== IMPORTAÇÕES =====
import { dbManager } from './firebase-config.js';

// ===== VARIÁVEIS GLOBAIS =====
let produtos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let usuarios = [];
let pedidos = [];
let produtoEditando = null;
let usuarioEditando = null;

// ===== ELEMENTOS DOM =====
const elements = {
    // Navegação
    menuToggle: document.getElementById('menu-toggle'),
    searchToggle: document.getElementById('search-toggle'),
    navMenu: document.getElementById('nav-menu'),
    searchBox: document.getElementById('search-box'),
    searchInput: document.getElementById('search-input'),
    
    // Carrinho
    carrinhoToggle: document.getElementById('carrinho-toggle'),
    carrinhoPanel: document.getElementById('carrinho-panel'),
    carrinhoClose: document.getElementById('carrinho-close'),
    carrinhoCount: document.getElementById('carrinho-count'),
    listaCarrinho: document.getElementById('lista-carrinho'),
    totalCarrinho: document.getElementById('total-carrinho'),
    
    // Admin
    adminToggle: document.getElementById('admin-toggle'),
    adminModal: document.getElementById('admin-modal'),
    adminClose: document.getElementById('admin-close'),
    
    // Vitrine
    vitrineGrid: document.getElementById('vitrine-grid'),
    categoriaBtns: document.querySelectorAll('.categoria-btn'),
    
    // Loading
    loadingScreen: document.getElementById('loading-screen')
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    
    try {
        await inicializarApp();
        setupEventListeners();
        await carregarDados();
        hideLoading();
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showToast('Erro ao carregar aplicação', 'error');
        hideLoading();
    }
});

async function inicializarApp() {
    // Configurar partículas
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: "#ffffff" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: false },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#ffffff",
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 6,
                    direction: "none",
                    random: false,
                    straight: false,
                    out_mode: "out",
                    bounce: false
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "repulse" },
                    onclick: { enable: true, mode: "push" },
                    resize: true
                }
            },
            retina_detect: true
        });
    }
    
    // Atualizar contador do carrinho
    atualizarContadorCarrinho();
}

function setupEventListeners() {
    // Menu toggle
    elements.menuToggle?.addEventListener('click', toggleMenu);
    
    // Search toggle
    elements.searchToggle?.addEventListener('click', toggleSearch);
    
    // Carrinho
    elements.carrinhoToggle?.addEventListener('click', toggleCarrinho);
    elements.carrinhoClose?.addEventListener('click', () => {
        elements.carrinhoPanel?.classList.remove('active');
    });
    
    // Admin
    elements.adminToggle?.addEventListener('click', toggleAdmin);
    elements.adminClose?.addEventListener('click', () => {
        elements.adminModal?.classList.remove('active');
    });
    
    // Categorias
    elements.categoriaBtns?.forEach(btn => {
        btn.addEventListener('click', () => filtrarPorCategoria(btn.dataset.categoria));
    });
    
    // Search
    elements.searchInput?.addEventListener('input', (e) => {
        filtrarProdutos(e.target.value);
    });
    
    // Botões do carrinho
    document.getElementById('btn-pagar')?.addEventListener('click', processarPagamento);
    document.getElementById('btn-limpar')?.addEventListener('click', limparCarrinho);
    
    // Admin navigation
    setupAdminNavigation();
    
    // Formulários
    setupFormularios();
    
    // Click fora para fechar modais
    document.addEventListener('click', (e) => {
        if (e.target === elements.adminModal) {
            elements.adminModal?.classList.remove('active');
        }
        if (e.target === elements.carrinhoPanel) {
            elements.carrinhoPanel?.classList.remove('active');
        }
    });
    
    // ESC para fechar modais
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.adminModal?.classList.remove('active');
            elements.carrinhoPanel?.classList.remove('active');
            elements.navMenu?.classList.remove('active');
            elements.searchBox?.classList.remove('active');
        }
    });
}

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function toggleMenu() {
    elements.navMenu?.classList.toggle('active');
    elements.searchBox?.classList.remove('active');
}

function toggleSearch() {
    elements.searchBox?.classList.toggle('active');
    elements.navMenu?.classList.remove('active');
    if (elements.searchBox?.classList.contains('active')) {
        elements.searchInput?.focus();
    }
}

function toggleCarrinho() {
    elements.carrinhoPanel?.classList.toggle('active');
    if (elements.carrinhoPanel?.classList.contains('active')) {
        renderizarCarrinho();
    }
}

function toggleAdmin() {
    elements.adminModal?.classList.toggle('active');
    if (elements.adminModal?.classList.contains('active')) {
        mostrarSecaoAdmin('dashboard');
        atualizarDashboard();
    }
}

// ===== FUNÇÕES DE LOADING =====
function showLoading() {
    elements.loadingScreen?.classList.add('active');
}

function hideLoading() {
    setTimeout(() => {
        elements.loadingScreen?.classList.remove('active');
    }, 1000);
}

// ===== FUNÇÕES DE DADOS =====
async function carregarDados() {
    try {
        // Carregar produtos
        const produtosResult = await dbManager.obterProdutos();
        if (produtosResult.success) {
            produtos = produtosResult.data;
            renderizarProdutos(produtos);
        }
        
        // Carregar usuários
        const usuariosResult = await dbManager.obterUsuarios();
        if (usuariosResult.success) {
            usuarios = usuariosResult.data;
        }
        
        // Carregar pedidos
        const pedidosResult = await dbManager.obterPedidos();
        if (pedidosResult.success) {
            pedidos = pedidosResult.data;
        }
        
        // Setup listeners em tempo real
        setupRealtimeListeners();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados do servidor', 'error');
    }
}

function setupRealtimeListeners() {
    // Listener para produtos
    dbManager.onProdutosChange((novosProdutos) => {
        produtos = novosProdutos;
        renderizarProdutos(produtos);
        if (document.querySelector('.admin-section.active')?.id === 'produtos-section') {
            renderizarProdutosAdmin();
        }
    });
    
    // Listener para usuários
    dbManager.onUsuariosChange((novosUsuarios) => {
        usuarios = novosUsuarios;
        if (document.querySelector('.admin-section.active')?.id === 'usuarios-section') {
            renderizarUsuariosAdmin();
        }
    });
    
    // Listener para pedidos
    dbManager.onPedidosChange((novosPedidos) => {
        pedidos = novosPedidos;
        if (document.querySelector('.admin-section.active')?.id === 'dashboard-section') {
            atualizarDashboard();
        }
    });
}

// ===== FUNÇÕES DE RENDERIZAÇÃO =====
function renderizarProdutos(produtosParaRenderizar) {
    if (!elements.vitrineGrid) return;
    
    elements.vitrineGrid.innerHTML = '';
    
    if (produtosParaRenderizar.length === 0) {
        elements.vitrineGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente ajustar os filtros de busca</p>
            </div>
        `;
        return;
    }
    
    produtosParaRenderizar.forEach((produto, index) => {
        const card = criarCardProduto(produto, index);
        elements.vitrineGrid.appendChild(card);
    });
}

function criarCardProduto(produto, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const precoFormatado = formatarPreco(produto.preco);
    const estoqueClass = produto.estoque <= 0 ? 'esgotado' : produto.estoque <= 5 ? 'baixo' : '';
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${produto.imagem || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}" 
                 alt="${produto.nome}" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
            ${produto.estoque <= 0 ? '<div class="badge esgotado">Esgotado</div>' : ''}
            ${produto.estoque > 0 && produto.estoque <= 5 ? '<div class="badge baixo">Últimas unidades</div>' : ''}
        </div>
        <div class="card-content">
            <div class="card-header">
                <h3 class="card-title">${produto.nome}</h3>
                <span class="card-category">${produto.categoria}</span>
            </div>
            <p class="card-description">${produto.descricao}</p>
            <div class="card-footer">
                <div class="price-section">
                    <span class="price">${precoFormatado}</span>
                    <span class="stock ${estoqueClass}">
                        <i class="fas fa-box"></i>
                        ${produto.estoque} em estoque
                    </span>
                </div>
                <button class="add-to-cart-btn" 
                        onclick="adicionarAoCarrinho('${produto.id}')"
                        ${produto.estoque <= 0 ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart"></i>
                    ${produto.estoque <= 0 ? 'Esgotado' : 'Adicionar'}
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// ===== FUNÇÕES DO CARRINHO =====
function adicionarAoCarrinho(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto || produto.estoque <= 0) {
        showToast('Produto não disponível', 'error');
        return;
    }
    
    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
        if (itemExistente.quantidade >= produto.estoque) {
            showToast('Quantidade máxima atingida', 'warning');
            return;
        }
        itemExistente.quantidade++;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            imagem: produto.imagem,
            quantidade: 1
        });
    }
    
    salvarCarrinho();
    atualizarContadorCarrinho();
    showToast(`${produto.nome} adicionado ao carrinho!`, 'success');
    
    // Animação do botão
    const btn = event.target.closest('.add-to-cart-btn');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 150);
}

function removerDoCarrinho(produtoId) {
    const index = carrinho.findIndex(item => item.id === produtoId);
    if (index !== -1) {
        const produto = carrinho[index];
        carrinho.splice(index, 1);
        salvarCarrinho();
        atualizarContadorCarrinho();
        renderizarCarrinho();
        showToast(`${produto.nome} removido do carrinho`, 'success');
    }
}

function alterarQuantidade(produtoId, novaQuantidade) {
    const item = carrinho.find(item => item.id === produtoId);
    const produto = produtos.find(p => p.id === produtoId);
    
    if (!item || !produto) return;
    
    if (novaQuantidade <= 0) {
        removerDoCarrinho(produtoId);
        return;
    }
    
    if (novaQuantidade > produto.estoque) {
        showToast('Quantidade não disponível em estoque', 'warning');
        return;
    }
    
    item.quantidade = novaQuantidade;
    salvarCarrinho();
    atualizarContadorCarrinho();
    renderizarCarrinho();
}

function renderizarCarrinho() {
    if (!elements.listaCarrinho) return;
    
    elements.listaCarrinho.innerHTML = '';
    
    if (carrinho.length === 0) {
        elements.listaCarrinho.innerHTML = `
            <div class="carrinho-empty">
                <i class="fas fa-shopping-cart"></i>
                <h3>Carrinho vazio</h3>
                <p>Adicione produtos para continuar</p>
            </div>
        `;
        elements.totalCarrinho.textContent = 'R$ 0,00';
        return;
    }
    
    let total = 0;
    
    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        
        const li = document.createElement('li');
        li.className = 'carrinho-item';
        li.innerHTML = `
            <div class="item-image">
                <img src="${item.imagem || 'https://via.placeholder.com/60x60?text=Produto'}" 
                     alt="${item.nome}"
                     onerror="this.src='https://via.placeholder.com/60x60?text=Produto'">
            </div>
            <div class="item-details">
                <h4>${item.nome}</h4>
                <span class="item-price">${formatarPreco(subtotal)}</span>
            </div>
            <div class="item-controls">
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="alterarQuantidade('${item.id}', ${item.quantidade - 1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity">${item.quantidade}</span>
                    <button class="qty-btn" onclick="alterarQuantidade('${item.id}', ${item.quantidade + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="remove-btn" onclick="removerDoCarrinho('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        elements.listaCarrinho.appendChild(li);
    });
    
    elements.totalCarrinho.textContent = formatarPreco(total);
}

function atualizarContadorCarrinho() {
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    if (elements.carrinhoCount) {
        elements.carrinhoCount.textContent = totalItens;
        elements.carrinhoCount.style.display = totalItens > 0 ? 'flex' : 'none';
    }
}

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function limparCarrinho() {
    if (carrinho.length === 0) {
        showToast('Carrinho já está vazio', 'warning');
        return;
    }
    
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
        carrinho = [];
        salvarCarrinho();
        atualizarContadorCarrinho();
        renderizarCarrinho();
        showToast('Carrinho limpo com sucesso!', 'success');
    }
}

async function processarPagamento() {
    if (carrinho.length === 0) {
        showToast('Carrinho vazio', 'warning');
        return;
    }
    
    // Verificar estoque antes do pagamento
    for (const item of carrinho) {
        const produto = produtos.find(p => p.id === item.id);
        if (!produto || produto.estoque < item.quantidade) {
            showToast(`Produto ${item.nome} não tem estoque suficiente`, 'error');
            return;
        }
    }
    
    try {
        const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
        
        const pedido = {
            itens: carrinho,
            total: total,
            data: new Date().toISOString(),
            status: 'pendente'
        };
        
        const result = await dbManager.salvarPedido(pedido);
        
        if (result.success) {
            // Atualizar estoque dos produtos
            for (const item of carrinho) {
                const produto = produtos.find(p => p.id === item.id);
                if (produto) {
                    produto.estoque -= item.quantidade;
                    await dbManager.salvarProduto(produto, produto.id);
                }
            }
            
            carrinho = [];
            salvarCarrinho();
            atualizarContadorCarrinho();
            renderizarCarrinho();
            elements.carrinhoPanel?.classList.remove('active');
            
            showToast('Pedido realizado com sucesso!', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Erro no pagamento:', error);
        showToast('Erro ao processar pagamento', 'error');
    }
}

// ===== FUNÇÕES DE FILTRO =====
function filtrarPorCategoria(categoria) {
    // Atualizar botões ativos
    elements.categoriaBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.categoria === categoria);
    });
    
    let produtosFiltrados;
    if (categoria === 'todos') {
        produtosFiltrados = produtos;
    } else {
        produtosFiltrados = produtos.filter(produto => 
            produto.categoria.toLowerCase() === categoria.toLowerCase()
        );
    }
    
    renderizarProdutos(produtosFiltrados);
}

function filtrarProdutos(termo) {
    if (!termo.trim()) {
        renderizarProdutos(produtos);
        return;
    }
    
    const termoLower = termo.toLowerCase();
    const produtosFiltrados = produtos.filter(produto =>
        produto.nome.toLowerCase().includes(termoLower) ||
        produto.descricao.toLowerCase().includes(termoLower) ||
        produto.categoria.toLowerCase().includes(termoLower)
    );
    
    renderizarProdutos(produtosFiltrados);
}

// ===== FUNÇÕES UTILITÁRIAS =====
function formatarPreco(preco) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(preco);
}

function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-message">${message}</div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Mostrar toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remover após 5 segundos
    const autoRemove = setTimeout(() => removeToast(toast), 5000);
    
    // Remover ao clicar no X
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        removeToast(toast);
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// ===== ADMIN FUNCTIONS =====
function setupAdminNavigation() {
    const adminNavBtns = document.querySelectorAll('.admin-nav-btn');
    adminNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const secao = btn.dataset.secao;
            mostrarSecaoAdmin(secao);
        });
    });
}

function mostrarSecaoAdmin(secao) {
    // Atualizar botões de navegação
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.secao === secao);
    });
    
    // Mostrar seção correspondente
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.toggle('active', section.id === `${secao}-section`);
    });
    
    // Carregar dados da seção
    switch(secao) {
        case 'dashboard':
            atualizarDashboard();
            break;
        case 'produtos':
            renderizarProdutosAdmin();
            break;
        case 'usuarios':
            renderizarUsuariosAdmin();
            break;
        case 'relatorios':
            atualizarRelatorios();
            break;
    }
}

function atualizarDashboard() {
    // Estatísticas gerais
    const totalProdutos = produtos.length;
    const totalUsuarios = usuarios.length;
    const totalPedidos = pedidos.length;
    const produtosEstoque = produtos.filter(p => p.estoque > 0).length;
    
    // Atualizar cards de estatísticas
    document.getElementById('total-produtos').textContent = totalProdutos;
    document.getElementById('total-usuarios').textContent = totalUsuarios;
    document.getElementById('total-pedidos').textContent = totalPedidos;
    document.getElementById('produtos-estoque').textContent = produtosEstoque;
    
    // Produtos com estoque baixo
    const produtosEstoqueBaixo = produtos.filter(p => p.estoque <= 5 && p.estoque > 0);
    const listaProdutosBaixo = document.getElementById('produtos-estoque-baixo');
    if (listaProdutosBaixo) {
        listaProdutosBaixo.innerHTML = produtosEstoqueBaixo.length > 0 
            ? produtosEstoqueBaixo.map(p => `<li>${p.nome} (${p.estoque} unidades)</li>`).join('')
            : '<li>Nenhum produto com estoque baixo</li>';
    }
    
    // Últimos pedidos
    const ultimosPedidos = pedidos.slice(-5).reverse();
    const listaUltimosPedidos = document.getElementById('ultimos-pedidos');
    if (listaUltimosPedidos) {
        listaUltimosPedidos.innerHTML = ultimosPedidos.length > 0
            ? ultimosPedidos.map(p => `
                <li>
                    Pedido #${p.id?.substring(0, 8)} - ${formatarPreco(p.total)}
                    <small>${new Date(p.data).toLocaleDateString()}</small>
                </li>
            `).join('')
            : '<li>Nenhum pedido encontrado</li>';
    }
}

function renderizarProdutosAdmin() {
    const produtosGrid = document.getElementById('produtos-admin-grid');
    if (!produtosGrid) return;
    
    produtosGrid.innerHTML = '';
    
    if (produtos.length === 0) {
        produtosGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>Nenhum produto cadastrado</h3>
                <p>Adicione o primeiro produto usando o formulário acima</p>
            </div>
        `;
        return;
    }
    
    produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'produto-admin-card';
        
        const estoqueClass = produto.estoque <= 0 ? 'esgotado' : produto.estoque <= 5 ? 'baixo' : '';
        
        card.innerHTML = `
            <div class="produto-admin-image">
                <img src="${produto.imagem || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}" 
                     alt="${produto.nome}"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
            </div>
            <div class="produto-admin-info">
                <h3>${produto.nome}</h3>
                <p>${produto.descricao}</p>
                <div class="produto-admin-meta">
                    <span class="preco">${formatarPreco(produto.preco)}</span>
                    <span class="categoria">${produto.categoria}</span>
                    <span class="estoque ${estoqueClass}">${produto.estoque} un.</span>
                </div>
                <div class="produto-admin-actions">
                    <button class="btn-edit" onclick="editarProduto('${produto.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deletarProduto('${produto.id}')">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
        
        produtosGrid.appendChild(card);
    });
}

function renderizarUsuariosAdmin() {
    const usuariosGrid = document.getElementById('usuarios-admin-grid');
    if (!usuariosGrid) return;
    
    usuariosGrid.innerHTML = '';
    
    if (usuarios.length === 0) {
        usuariosGrid.innerHTML = `
            <div class="no-users">
                <i class="fas fa-users"></i>
                <h3>Nenhum usuário cadastrado</h3>
                <p>Os usuários aparecerão aqui conforme se cadastrarem</p>
            </div>
        `;
        return;
    }
    
    usuarios.forEach(usuario => {
        const card = document.createElement('div');
        card.className = 'usuario-card';
        
        const iniciais = usuario.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        card.innerHTML = `
            <div class="usuario-info">
                <div class="usuario-avatar">${iniciais}</div>
                <div class="usuario-details">
                    <h4>${usuario.nome}</h4>
                    <p>${usuario.email}</p>
                </div>
            </div>
            <div class="usuario-status">
                <span class="status-badge ${usuario.ativo ? 'ativo' : 'inativo'}">
                    ${usuario.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <small>${new Date(usuario.createdAt).toLocaleDateString()}</small>
            </div>
            <div class="usuario-actions">
                <button class="btn-user-edit" onclick="editarUsuario('${usuario.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-user-delete" onclick="deletarUsuario('${usuario.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        usuariosGrid.appendChild(card);
    });
}

function atualizarRelatorios() {
    // Vendas por categoria
    const vendasPorCategoria = {};
    pedidos.forEach(pedido => {
        pedido.itens.forEach(item => {
            const produto = produtos.find(p => p.id === item.id);
            if (produto) {
                const categoria = produto.categoria;
                vendasPorCategoria[categoria] = (vendasPorCategoria[categoria] || 0) + item.quantidade;
            }
        });
    });
    
    const relatorioVendas = document.getElementById('relatorio-vendas');
    if (relatorioVendas) {
        relatorioVendas.innerHTML = Object.keys(vendasPorCategoria).length > 0
            ? Object.entries(vendasPorCategoria)
                .map(([categoria, quantidade]) => `<p>${categoria}: <span>${quantidade} vendidos</span></p>`)
                .join('')
            : '<p>Nenhuma venda registrada</p>';
    }
    
    // Produtos mais vendidos
    const produtosMaisVendidos = {};
    pedidos.forEach(pedido => {
        pedido.itens.forEach(item => {
            produtosMaisVendidos[item.id] = (produtosMaisVendidos[item.id] || 0) + item.quantidade;
        });
    });
    
    const topProdutos = Object.entries(produtosMaisVendidos)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const relatorioTop = document.getElementById('relatorio-top-produtos');
    if (relatorioTop) {
        relatorioTop.innerHTML = topProdutos.length > 0
            ? topProdutos.map(([id, quantidade]) => {
                const produto = produtos.find(p => p.id === id);
                return produto ? `<p>${produto.nome}: <span>${quantidade} vendidos</span></p>` : '';
            }).join('')
            : '<p>Nenhuma venda registrada</p>';
    }
    
    // Receita total
    const receitaTotal = pedidos.reduce((total, pedido) => total + pedido.total, 0);
    const relatorioReceita = document.getElementById('relatorio-receita');
    if (relatorioReceita) {
        relatorioReceita.innerHTML = `<p>Total: <span>${formatarPreco(receitaTotal)}</span></p>`;
    }
}

// ===== CRUD PRODUTOS =====
function setupFormularios() {
    const produtoForm = document.getElementById('produto-form');
    if (produtoForm) {
        produtoForm.addEventListener('submit', salvarProdutoForm);
    }
    
    const usuarioForm = document.getElementById('usuario-form');
    if (usuarioForm) {
        usuarioForm.addEventListener('submit', salvarUsuarioForm);
    }
    
    // Preview de imagem
    const imagemInput = document.getElementById('produto-imagem');
    if (imagemInput) {
        imagemInput.addEventListener('change', previewImagem);
    }
    
    // Botão cancelar
    const btnCancelar = document.getElementById('btn-cancelar-produto');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarEdicaoProduto);
    }
}

async function salvarProdutoForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const produto = {
        nome: formData.get('nome'),
        descricao: formData.get('descricao'),
        preco: parseFloat(formData.get('preco')),
        categoria: formData.get('categoria'),
        estoque: parseInt(formData.get('estoque')),
        imagem: formData.get('imagem')
    };
    
    // Validações
    if (!produto.nome || !produto.descricao || !produto.preco || !produto.categoria) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    if (produto.preco <= 0) {
        showToast('Preço deve ser maior que zero', 'error');
        return;
    }
    
    if (produto.estoque < 0) {
        showToast('Estoque não pode ser negativo', 'error');
        return;
    }
    
    try {
        const result = await dbManager.salvarProduto(produto, produtoEditando);
        
        if (result.success) {
            showToast(result.message, 'success');
            e.target.reset();
            cancelarEdicaoProduto();
            document.getElementById('image-preview').style.display = 'none';
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showToast('Erro ao salvar produto', 'error');
    }
}

function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    
    produtoEditando = id;
    
    // Preencher formulário
    document.getElementById('produto-nome').value = produto.nome;
    document.getElementById('produto-descricao').value = produto.descricao;
    document.getElementById('produto-preco').value = produto.preco;
    document.getElementById('produto-categoria').value = produto.categoria;
    document.getElementById('produto-estoque').value = produto.estoque;
    document.getElementById('produto-imagem').value = produto.imagem || '';
    
    // Mostrar preview da imagem
    if (produto.imagem) {
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `<img src="${produto.imagem}" alt="Preview">`;
        preview.style.display = 'block';
    }
    
    // Mostrar botão cancelar e alterar texto do submit
    document.getElementById('btn-cancelar-produto').classList.add('show');
    document.querySelector('#produto-form .btn-submit').innerHTML = '<i class="fas fa-save"></i> Atualizar Produto';
    
    // Scroll para o formulário
    document.getElementById('produto-form').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoProduto() {
    produtoEditando = null;
    document.getElementById('produto-form').reset();
    document.getElementById('btn-cancelar-produto').classList.remove('show');
    document.querySelector('#produto-form .btn-submit').innerHTML = '<i class="fas fa-plus"></i> Adicionar Produto';
    document.getElementById('image-preview').style.display = 'none';
}

async function deletarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    
    if (!confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
        return;
    }
    
    try {
        const result = await dbManager.deletarProduto(id);
        
        if (result.success) {
            showToast(result.message, 'success');
            
            // Remover do carrinho se existir
            carrinho = carrinho.filter(item => item.id !== id);
            salvarCarrinho();
            atualizarContadorCarrinho();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        showToast('Erro ao deletar produto', 'error');
    }
}

function previewImagem(e) {
    const url = e.target.value;
    const preview = document.getElementById('image-preview');
    
    if (url) {
        preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.style.display='none'">`;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

// ===== CRUD USUÁRIOS =====
async function salvarUsuarioForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const usuario = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        telefone: formData.get('telefone'),
        ativo: formData.get('ativo') === 'on'
    };
    
    // Validações
    if (!usuario.nome || !usuario.email) {
        showToast('Nome e email são obrigatórios', 'error');
        return;
    }
    
    if (!isValidEmail(usuario.email)) {
        showToast('Email inválido', 'error');
        return;
    }
    
    // Verificar email duplicado
    const emailExiste = usuarios.some(u => u.email === usuario.email && u.id !== usuarioEditando);
    if (emailExiste) {
        showToast('Email já cadastrado', 'error');
        return;
    }
    
    try {
        const result = await dbManager.salvarUsuario(usuario, usuarioEditando);
        
        if (result.success) {
            showToast(result.message, 'success');
            e.target.reset();
            cancelarEdicaoUsuario();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        showToast('Erro ao salvar usuário', 'error');
    }
}

function editarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;
    
    usuarioEditando = id;
    
    // Preencher formulário
    document.getElementById('usuario-nome').value = usuario.nome;
    document.getElementById('usuario-email').value = usuario.email;
    document.getElementById('usuario-telefone').value = usuario.telefone || '';
    document.getElementById('usuario-ativo').checked = usuario.ativo;
    
    // Mostrar botão cancelar e alterar texto do submit
    document.getElementById('btn-cancelar-usuario').classList.add('show');
    document.querySelector('#usuario-form .btn-submit').innerHTML = '<i class="fas fa-save"></i> Atualizar Usuário';
    
    // Scroll para o formulário
    document.getElementById('usuario-form').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoUsuario() {
    usuarioEditando = null;
    document.getElementById('usuario-form').reset();
    document.getElementById('btn-cancelar-usuario').classList.remove('show');
    document.querySelector('#usuario-form .btn-submit').innerHTML = '<i class="fas fa-plus"></i> Adicionar Usuário';
}

async function deletarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;
    
    if (!confirm(`Tem certeza que deseja excluir o usuário "${usuario.nome}"?`)) {
        return;
    }
    
    try {
        const result = await dbManager.deletarUsuario(id);
        
        if (result.success) {
            showToast(result.message, 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        showToast('Erro ao deletar usuário', 'error');
    }
}

// ===== FUNÇÕES UTILITÁRIAS =====
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===== FILTROS ADMIN =====
function setupFiltrosAdmin() {
    // Filtro de produtos
    const produtoSearch = document.getElementById('produto-search');
    const produtoFilter = document.getElementById('produto-filter');
    
    if (produtoSearch) {
        produtoSearch.addEventListener('input', filtrarProdutosAdmin);
    }
    
    if (produtoFilter) {
        produtoFilter.addEventListener('change', filtrarProdutosAdmin);
    }
    
    // Filtro de usuários
    const usuarioSearch = document.getElementById('usuario-search');
    if (usuarioSearch) {
        usuarioSearch.addEventListener('input', filtrarUsuariosAdmin);
    }
}

function filtrarProdutosAdmin() {
    const searchTerm = document.getElementById('produto-search')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('produto-filter')?.value || 'todos';
    
    let produtosFiltrados = produtos;
    
    // Filtrar por categoria
    if (categoryFilter !== 'todos') {
        produtosFiltrados = produtosFiltrados.filter(p => p.categoria === categoryFilter);
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
        produtosFiltrados = produtosFiltrados.filter(p =>
            p.nome.toLowerCase().includes(searchTerm) ||
            p.descricao.toLowerCase().includes(searchTerm)
        );
    }
    
    renderizarProdutosFiltrados(produtosFiltrados);
}

function filtrarUsuariosAdmin() {
    const searchTerm = document.getElementById('usuario-search')?.value.toLowerCase() || '';
    
    let usuariosFiltrados = usuarios;
    
    if (searchTerm) {
        usuariosFiltrados = usuariosFiltrados.filter(u =>
            u.nome.toLowerCase().includes(searchTerm) ||
            u.email.toLowerCase().includes(searchTerm)
        );
    }
    
    renderizarUsuariosFiltrados(usuariosFiltrados);
}

function renderizarProdutosFiltrados(produtosFiltrados) {
    const produtosGrid = document.getElementById('produtos-admin-grid');
    if (!produtosGrid) return;
    
    produtosGrid.innerHTML = '';
    
    if (produtosFiltrados.length === 0) {
        produtosGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente ajustar os filtros de busca</p>
            </div>
        `;
        return;
    }
    
    produtosFiltrados.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'produto-admin-card';
        
        const estoqueClass = produto.estoque <= 0 ? 'esgotado' : produto.estoque <= 5 ? 'baixo' : '';
        
        card.innerHTML = `
            <div class="produto-admin-image">
                <img src="${produto.imagem || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}" 
                     alt="${produto.nome}"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
            </div>
            <div class="produto-admin-info">
                <h3>${produto.nome}</h3>
                <p>${produto.descricao}</p>
                <div class="produto-admin-meta">
                    <span class="preco">${formatarPreco(produto.preco)}</span>
                    <span class="categoria">${produto.categoria}</span>
                    <span class="estoque ${estoqueClass}">${produto.estoque} un.</span>
                </div>
                <div class="produto-admin-actions">
                    <button class="btn-edit" onclick="editarProduto('${produto.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deletarProduto('${produto.id}')">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
        
        produtosGrid.appendChild(card);
    });
}

function renderizarUsuariosFiltrados(usuariosFiltrados) {
    const usuariosGrid = document.getElementById('usuarios-admin-grid');
    if (!usuariosGrid) return;
    
    usuariosGrid.innerHTML = '';
    
    if (usuariosFiltrados.length === 0) {
        usuariosGrid.innerHTML = `
            <div class="no-users">
                <i class="fas fa-search"></i>
                <h3>Nenhum usuário encontrado</h3>
                <p>Tente ajustar o termo de busca</p>
            </div>
        `;
        return;
    }
    
    usuariosFiltrados.forEach(usuario => {
        const card = document.createElement('div');
        card.className = 'usuario-card';
        
        const iniciais = usuario.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        card.innerHTML = `
            <div class="usuario-info">
                <div class="usuario-avatar">${iniciais}</div>
                <div class="usuario-details">
                    <h4>${usuario.nome}</h4>
                    <p>${usuario.email}</p>
                </div>
            </div>
            <div class="usuario-status">
                <span class="status-badge ${usuario.ativo ? 'ativo' : 'inativo'}">
                    ${usuario.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <small>${new Date(usuario.createdAt).toLocaleDateString()}</small>
            </div>
            <div class="usuario-actions">
                <button class="btn-user-edit" onclick="editarUsuario('${usuario.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-user-delete" onclick="deletarUsuario('${usuario.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        usuariosGrid.appendChild(card);
    });
}

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.editarProduto = editarProduto;
window.deletarProduto = deletarProduto;
window.editarUsuario = editarUsuario;
window.deletarUsuario = deletarUsuario;

// ===== INICIALIZAR FILTROS QUANDO DOM ESTIVER PRONTO =====
document.addEventListener('DOMContentLoaded', () => {
    setupFiltrosAdmin();
});
