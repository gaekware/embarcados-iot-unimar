module.exports = {
    uiPort: process.env.PORT || 1880,

    // Editor na raiz — acesse http://localhost:1880
    // httpAdminRoot: '/',   // padrão, não precisa declarar

    // Dashboard em /ui — acesse http://localhost:1880/ui
    httpNodeRoot: '/',

    userDir: '/data',

    editorTheme: {
        projects: {
            enabled: false
        },
        palette: {
            allowInstall: true
        }
    },

    logging: {
        console: {
            level: 'info',
            metrics: false,
            audit: false
        }
    },

    functionGlobalContext: {
        TZ: 'America/Sao_Paulo'
    }
}
