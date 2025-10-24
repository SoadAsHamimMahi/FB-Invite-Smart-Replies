// Injects a persistent right-side panel with the extension UI embedded via iframe
(function(){
    if (window.__fbSmartRepliesSidebarInjected) return;
    window.__fbSmartRepliesSidebarInjected = true;

    const STORAGE_KEY = 'sidebarOpen';
    const PANEL_ID = 'fb-smart-replies-sidebar';
    const TOGGLE_ID = 'fb-smart-replies-toggle';

    function createStyles(){
        const s = document.createElement('style');
        s.textContent = `
            #${PANEL_ID}{position:fixed;top:0;right:0;height:100vh;width:420px;max-width:90vw;background:#fff;border-left:1px solid #dee2e6;box-shadow:-2px 0 12px rgba(0,0,0,.08);z-index:2147483646;display:flex;flex-direction:column;}
            #${PANEL_ID}.hidden{display:none}
            #${PANEL_ID} .hdr{height:40px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;background:#1877f2;color:#fff;font:500 13px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}
            #${PANEL_ID} .hdr .btn{border:0;background:rgba(255,255,255,.18);color:#fff;border-radius:8px;padding:6px 8px;cursor:pointer}
            #${PANEL_ID} iframe{border:0;flex:1;min-height:0;width:100%}
            #${TOGGLE_ID}{position:fixed;top:100px;right:12px;z-index:2147483646;background:#1877f2;color:#fff;border:0;border-radius:16px;padding:8px 10px;font:600 12px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;box-shadow:0 4px 10px rgba(0,0,0,.15);cursor:pointer}
        `;
        document.documentElement.appendChild(s);
    }

    function createPanel(){
        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        const hdr = document.createElement('div');
        hdr.className = 'hdr';
        hdr.innerHTML = `<span>FB Invite & Smart Replies</span><div><button class="btn" id="_fb_sr_close">Close</button></div>`;
        const iframe = document.createElement('iframe');
        iframe.src = chrome.runtime.getURL('popup.html#reply,embed');
        panel.appendChild(hdr);
        panel.appendChild(iframe);
        document.documentElement.appendChild(panel);
        document.getElementById('_fb_sr_close').addEventListener('click', () => setOpen(false));
        return panel;
    }

    function createToggle(){
        const btn = document.createElement('button');
        btn.id = TOGGLE_ID;
        btn.textContent = 'Smart Replies';
        btn.addEventListener('click', () => setOpen(true));
        document.documentElement.appendChild(btn);
        return btn;
    }

    function setOpen(open){
        const panel = document.getElementById(PANEL_ID) || createPanel();
        const toggle = document.getElementById(TOGGLE_ID) || createToggle();
        panel.classList.toggle('hidden', !open);
        toggle.style.display = open ? 'none' : 'inline-block';
        try{ chrome.storage.local.set({ [STORAGE_KEY]: open ? 1 : 0 }); }catch(_){ }
    }

    function init(){
        createStyles();
        createToggle();
        try{
            chrome.storage.local.get([STORAGE_KEY]).then(v => {
                // default: open by default the first time
                const first = !(v && (STORAGE_KEY in v));
                setOpen(first ? true : v[STORAGE_KEY] === 1);
            }).catch(() => setOpen(false));
        }catch(_){ setOpen(false); }
    }

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init);
    else
        init();
})();


