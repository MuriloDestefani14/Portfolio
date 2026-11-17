# Como editar e publicar o portfólio

## 1. Personalizar (só um arquivo)
Abra `conteudo.js` e troque:
- `PERFIL`: nome, cargo, texto de apresentação, cidade e links (GitHub, LinkedIn, e-mail). Link vazio (`''`) não aparece no site.
- `EXPERIENCIA`: cargo, período e os pontos. Os textos atuais são exemplos baseados no que os projetos mostram; **revise e ajuste ao que é verdade para você**.
- `HABILIDADES`, `PROJETOS`, `PAINEIS`, `AUTOMACOES`: textos e mídia de cada cartão.
- `codigo: ''` em cada projeto: cole o link do repositório quando existir; o botão "Ver código" aparece sozinho.

Para testar no seu PC sem publicar, abra um terminal nesta pasta e rode:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`. (Abrir o `index.html` com duplo clique mostra o site, mas a demo do app com celular + PC só sincroniza por servidor.)

## 2. Publicar no GitHub Pages
1. Crie uma conta **pessoal** no GitHub, com e-mail pessoal. Em *Settings → Emails*, marque **Keep my email addresses private** e use o endereço `noreply` nos commits, para o e-mail corporativo não aparecer.
2. No **GitHub Desktop**: *File → Add local repository* e escolha esta pasta (`Portfolio - Site`). Aceite criar o repositório. Dê o nome `portfolio`.
3. Faça o primeiro *Commit* e clique em **Publish repository**. Deixe como **público** e **desmarque** "Keep this code private".
4. No GitHub, abra o repositório: *Settings → Pages → Build and deployment*. Em *Source* escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e salve.
5. Em 1 a 2 minutos o site fica em `https://SEU-USUARIO.github.io/portfolio/`.

Para atualizar depois: edite os arquivos, faça *Commit* e *Push origin* no GitHub Desktop.

## 3. Antes de publicar, confira
- Nenhum arquivo da empresa está nesta pasta. Se você copiar algo novo para cá, revise antes.
- Todos os dados e nomes do site e das demos são fictícios. Evite citar nos textos a empresa ou sistemas internos.
- Confirme com a empresa se pode divulgar os painéis e aplicativos, mesmo com tema e dados trocados.

## 4. Estrutura da pasta
| Item | O que é |
|---|---|
| `index.html`, `style.css`, `app.js` | O site (não precisa mexer) |
| `conteudo.js` | Todo o conteúdo editável |
| `assets/midia/` | Prints (PNG) e vídeos (WebM, com GIF de reserva) |
| `demos/` | As 4 demos interativas que abrem pelos botões |
| `.nojekyll` | Faz o GitHub Pages servir os arquivos como estão |

Os vídeos são WebM (VP9). Navegadores que não tocam esse formato mostram o GIF automaticamente.
