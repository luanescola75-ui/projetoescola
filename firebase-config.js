// ===== FIREBASE CONFIGURATION =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    set, 
    get, 
    child, 
    push, 
    update, 
    remove, 
    onValue,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAFE7gbnch3hstHc8PXqidjMGENqPTl7ts",
    authDomain: "projeto-b8aea.firebaseapp.com",
    databaseURL: "https://projeto-b8aea-default-rtdb.firebaseio.com",
    projectId: "projeto-b8aea",
    storageBucket: "projeto-b8aea.firebasestorage.app",
    messagingSenderId: "544644492441",
    appId: "1:544644492441:web:c52f55961daa0c1baf9c08",
    measurementId: "G-FT28Y1V57F"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== FUNÇÕES DO BANCO DE DADOS =====
export class DatabaseManager {
    constructor() {
        this.db = db;
    }

    // Produtos
    async salvarProduto(produto, id = null) {
        try {
            const produtoData = {
                ...produto,
                updatedAt: serverTimestamp(),
                createdAt: id ? produto.createdAt : serverTimestamp()
            };

            if (id) {
                await update(ref(this.db, `produtos/${id}`), produtoData);
                return { success: true, message: 'Produto atualizado com sucesso!', id };
            } else {
                const newRef = await push(ref(this.db, "produtos"), produtoData);
                return { success: true, message: 'Produto adicionado com sucesso!', id: newRef.key };
            }
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
                       return { success: false, message: 'Erro ao salvar produto: ' + error.message };
        }
    }

    async obterProdutos() {
        try {
            const snapshot = await get(ref(this.db, "produtos"));
            if (snapshot.exists()) {
                const produtos = [];
                snapshot.forEach((childSnapshot) => {
                    produtos.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                return { success: true, data: produtos };
            } else {
                return { success: true, data: [] };
            }
        } catch (error) {
            console.error('Erro ao obter produtos:', error);
            return { success: false, message: 'Erro ao carregar produtos: ' + error.message };
        }
    }

    async obterProduto(id) {
        try {
            const snapshot = await get(ref(this.db, `produtos/${id}`));
            if (snapshot.exists()) {
                return { 
                    success: true, 
                    data: { id: snapshot.key, ...snapshot.val() } 
                };
            } else {
                return { success: false, message: 'Produto não encontrado' };
            }
        } catch (error) {
            console.error('Erro ao obter produto:', error);
            return { success: false, message: 'Erro ao carregar produto: ' + error.message };
        }
    }

    async deletarProduto(id) {
        try {
            await remove(ref(this.db, `produtos/${id}`));
            return { success: true, message: 'Produto deletado com sucesso!' };
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            return { success: false, message: 'Erro ao deletar produto: ' + error.message };
        }
    }

    // Usuários
    async salvarUsuario(usuario, id = null) {
        try {
            const usuarioData = {
                ...usuario,
                updatedAt: serverTimestamp(),
                createdAt: id ? usuario.createdAt : serverTimestamp()
            };

            if (id) {
                await update(ref(this.db, `usuarios/${id}`), usuarioData);
                return { success: true, message: 'Usuário atualizado com sucesso!', id };
            } else {
                const newRef = await push(ref(this.db, "usuarios"), usuarioData);
                return { success: true, message: 'Usuário adicionado com sucesso!', id: newRef.key };
            }
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            return { success: false, message: 'Erro ao salvar usuário: ' + error.message };
        }
    }

    async obterUsuarios() {
        try {
            const snapshot = await get(ref(this.db, "usuarios"));
            if (snapshot.exists()) {
                const usuarios = [];
                snapshot.forEach((childSnapshot) => {
                    usuarios.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                return { success: true, data: usuarios };
            } else {
                return { success: true, data: [] };
            }
        } catch (error) {
            console.error('Erro ao obter usuários:', error);
            return { success: false, message: 'Erro ao carregar usuários: ' + error.message };
        }
    }

    async deletarUsuario(id) {
        try {
            await remove(ref(this.db, `usuarios/${id}`));
            return { success: true, message: 'Usuário deletado com sucesso!' };
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            return { success: false, message: 'Erro ao deletar usuário: ' + error.message };
        }
    }

    // Pedidos
    async salvarPedido(pedido) {
        try {
            const pedidoData = {
                ...pedido,
                createdAt: serverTimestamp(),
                status: 'pendente'
            };

            const newRef = await push(ref(this.db, "pedidos"), pedidoData);
            return { success: true, message: 'Pedido realizado com sucesso!', id: newRef.key };
        } catch (error) {
            console.error('Erro ao salvar pedido:', error);
            return { success: false, message: 'Erro ao processar pedido: ' + error.message };
        }
    }

    async obterPedidos() {
        try {
            const snapshot = await get(ref(this.db, "pedidos"));
            if (snapshot.exists()) {
                const pedidos = [];
                snapshot.forEach((childSnapshot) => {
                    pedidos.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                return { success: true, data: pedidos };
            } else {
                return { success: true, data: [] };
            }
        } catch (error) {
            console.error('Erro ao obter pedidos:', error);
            return { success: false, message: 'Erro ao carregar pedidos: ' + error.message };
        }
    }

    // Configurações
    async salvarConfiguracao(chave, valor) {
        try {
            await set(ref(this.db, `configuracoes/${chave}`), {
                valor: valor,
                updatedAt: serverTimestamp()
            });
            return { success: true, message: 'Configuração salva com sucesso!' };
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            return { success: false, message: 'Erro ao salvar configuração: ' + error.message };
        }
    }

    async obterConfiguracao(chave) {
        try {
            const snapshot = await get(ref(this.db, `configuracoes/${chave}`));
            if (snapshot.exists()) {
                return { success: true, data: snapshot.val().valor };
            } else {
                return { success: false, message: 'Configuração não encontrada' };
            }
        } catch (error) {
            console.error('Erro ao obter configuração:', error);
            return { success: false, message: 'Erro ao carregar configuração: ' + error.message };
        }
    }

    // Listeners em tempo real
    onProdutosChange(callback) {
        const produtosRef = ref(this.db, 'produtos');
        return onValue(produtosRef, (snapshot) => {
            const produtos = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    produtos.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
            }
            callback(produtos);
        });
    }

    onUsuariosChange(callback) {
        const usuariosRef = ref(this.db, 'usuarios');
        return onValue(usuariosRef, (snapshot) => {
            const usuarios = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    usuarios.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
            }
            callback(usuarios);
        });
    }

    onPedidosChange(callback) {
        const pedidosRef = ref(this.db, 'pedidos');
        return onValue(pedidosRef, (snapshot) => {
            const pedidos = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    pedidos.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
            }
            callback(pedidos);
        });
    }
}

// Exportar instância única
export const dbManager = new DatabaseManager();
