// ============================================================
// penilaian-orang.js — Penilaian Per Orang section (SPA) v5.0
// Admin Panel — Dinas Koperasi UKM
//
// PERUBAHAN v5.0:
//  - Full professional redesign: refined government/enterprise SaaS aesthetic
//  - Stat cards dengan accent stripe & icon yang lebih bersih
//  - Table dengan row hover state, sticky header, compact but readable
//  - Modal redesign: two-column layout yang lebih proporsional
//  - Mobile-first layout: card-based view untuk layar kecil
//  - Typography: DM Sans / system stack yang lebih tajam
//  - Semua logika v3.3/v4.0 tetap 100% sama
// ============================================================
(function () {
    'use strict';

    var SECTION_ID     = 'penilaian-orang';
    var DATA_KEY       = 'penilaian_orang_v2';
    var TEAM_CACHE_KEY = 'penilaian_orang_team_cache_v1';
    var DIKLAT_CACHE_KEY = 'penilaian_orang_diklat_cache_v1';

    function getGasUrl() {
        return (window.PPO_GAS_CONFIG && window.PPO_GAS_CONFIG.url)
            ? window.PPO_GAS_CONFIG.url : '';
    }
    function getOperasionalUrl() {
        return (window.PPO_GAS_CONFIG && window.PPO_GAS_CONFIG.urlOperasional)
            ? window.PPO_GAS_CONFIG.urlOperasional : '';
    }

    var MONTHS = ['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI',
                  'JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];
    var MONTH_LABELS = {
        JANUARI:'Januari',FEBRUARI:'Februari',MARET:'Maret',APRIL:'April',
        MEI:'Mei',JUNI:'Juni',JULI:'Juli',AGUSTUS:'Agustus',
        SEPTEMBER:'September',OKTOBER:'Oktober',NOVEMBER:'November',DESEMBER:'Desember'
    };

    var UNITS = [
        'Sekretariat','Bidang Koperasi','Bidang UKM',
        'Bidang Usaha Mikro','Bidang Kewirausahaan',
        'Balai Layanan Usaha Terpadu KUMKM'
    ];

    var AKHLAK = [
        { key:'pelayanan',   label:'Berorientasi Pelayanan',
          desc:'Memahami & memenuhi kebutuhan masyarakat; ramah, cekatan, solutif; melakukan perbaikan tiada henti.' },
        { key:'akuntabel',   label:'Akuntabel',
          desc:'Jujur, bertanggung jawab, cermat, disiplin, berintegritas; efisien gunakan BMN; tidak menyalahgunakan wewenang.' },
        { key:'kompeten',    label:'Kompeten',
          desc:'Mengembangkan kompetensi diri; membantu orang lain belajar; melaksanakan tugas dengan kualitas terbaik.' },
        { key:'harmonis',    label:'Harmonis',
          desc:'Menghargai setiap orang apapun latar belakangnya; suka menolong; membangun lingkungan kerja kondusif.' },
        { key:'loyal',       label:'Loyal',
          desc:'Setia pada Pancasila & UUD 1945, NKRI & pemerintahan yang sah; menjaga nama baik instansi; menjaga rahasia jabatan.' },
        { key:'adaptif',     label:'Adaptif',
          desc:'Cepat menyesuaikan diri; terus berinovasi & kreatif; bertindak proaktif.' },
        { key:'kolaboratif', label:'Kolaboratif',
          desc:'Memberi kesempatan kontribusi; terbuka bekerja sama; menggerakkan pemanfaatan sumber daya bersama.' }
    ];

    var ROLE_TO_GID = {
        penilai_sekretariat:  'sekretariat',
        penilai_ketua:        'agus',
        penilai_koperasi:     'koperasi',
        penilai_ukm:          'ukm',
        penilai_usaha_mikro:  'usaha-mikro',
        penilai_kewirausahaan:'kewirausahaan',
        penilai_blut:         'blut',
    };

    var GROUPS = [
        {
            id:'agus', evaluator:'Agus Mulyono, S.P., M.T.', unitLabel:'Lintas Unit',
            people:[
                { name:'Ritaningrum, S.Sos., M.M.',                       unit:'Sekretariat' },
                { name:'Hellen Phornica, S.T.P., M.Si.',                  unit:'Bidang UKM' },
                { name:'Veronica Setioningtyas Prativi, S.Si., M.Si.',     unit:'Bidang Usaha Mikro' },
                { name:'Wisnu Hermawan, S.P., M.T.',                      unit:'Balai Layanan Usaha Terpadu KUMKM' },
                { name:'Ir. Setyo Hastuti, M.P.',                         unit:'Bidang Koperasi' },
                { name:'Hana Fais Prabowo, S.T.P., M.Si.',                unit:'Bidang Kewirausahaan' }
            ]
        },
        {
            id:'sekretariat', evaluator:'Ritaningrum, S.Sos., M.M.', unitLabel:'Sekretariat',
            people:[
                { name:'Fuji Ippa Wati, S.E.',                   unit:'Sekretariat' },
                { name:'Winarto, S.E.',                           unit:'Sekretariat' },
                { name:'Ice Norawati, S.E., Akt.',                unit:'Sekretariat' },
                { name:'Marselina Widaranti, S.T., M.T.',         unit:'Sekretariat' },
                { name:'Hana Kurniawati',                         unit:'Sekretariat' },
                { name:'Raden Bambang Bagus Tri Hantoro, S.M.',   unit:'Sekretariat' },
                { name:'Heru Wiranto, SIP',                       unit:'Sekretariat' },
                { name:'Septia Yudha Rennaningtyas, S.M.B.',      unit:'Sekretariat' },
                { name:'Dias Hartanto, S.M.',                     unit:'Sekretariat' },
                { name:'Anas Margono, S.Kom.',                    unit:'Sekretariat' },
                { name:'Joko Sambudi Raharjo',                    unit:'Sekretariat' },
                { name:'Luvianingsih, A.Md.',                     unit:'Sekretariat' },
                { name:'Hesti Ratnasari, A.Md.',                  unit:'Sekretariat' },
                { name:'Rana Salsabila Putri',                    unit:'Sekretariat' },
                { name:'Bob Prabowo, S.E.',                       unit:'Sekretariat' },
                { name:'Windu Wahyu Suryaningsih, S.E.',          unit:'Sekretariat' },
                { name:'Dhaniar Fitria Widyaningtyas, S.E.',      unit:'Sekretariat' },
                { name:'Nita Arum Sari, A.Md.Sek.',              unit:'Sekretariat' }
            ]
        },
        {
            id:'koperasi', evaluator:'Ir. Setyo Hastuti, M.P.', unitLabel:'Bidang Koperasi',
            people:[
                { name:'Purnama Setiawan, S.T.',             unit:'Bidang Koperasi' },
                { name:'Fikri Muttaqin, S.A.B.',             unit:'Bidang Koperasi' },
                { name:'Rembranto Gusani Putro, S.A.B.',     unit:'Bidang Koperasi' },
                { name:'Faris Rizki Rahardian, S.H.',        unit:'Bidang Koperasi' },
                { name:'Anindya Putri Kusumaningrum, S.H.',  unit:'Bidang Koperasi' },
                { name:'Firdha Ikhsania Fadilla, S.H.',      unit:'Bidang Koperasi' },
                { name:'Laura Nindya Khalista, S.H.',        unit:'Bidang Koperasi' }
            ]
        },
        {
            id:'ukm', evaluator:'Hellen Phornica, S.T.P., M.Si.', unitLabel:'Bidang UKM',
            people:[
                { name:'Perpetua Windhy Harmonie, S.E., M.E.', unit:'Bidang UKM' },
                { name:'Yogie Krisnawangi Saifullah, S.A.B.',   unit:'Bidang UKM' },
                { name:'Ali Najmudin, S.A.B.',                  unit:'Bidang UKM' },
                { name:'Edi Susila',                            unit:'Bidang UKM' },
                { name:'Asyifa Dicha Firani, S.T.',             unit:'Bidang UKM' },
                { name:'Deni Wijayanto, S.Kom.',                unit:'Bidang UKM' }
            ]
        },
        {
            id:'usaha-mikro', evaluator:'Veronica Setioningtyas Prativi, S.Si., M.Si.', unitLabel:'Bidang Usaha Mikro',
            people:[
                { name:'Alexius Widhi Nur Pambudi, S.E., M.Sc.', unit:'Bidang Usaha Mikro' },
                { name:'Rizki Octaviani, S.T.',                  unit:'Bidang Usaha Mikro' },
                { name:'Desi Kurniawati, S.H., M.Acc.',          unit:'Bidang Usaha Mikro' },
                { name:'Asrindha Patriandina, S.STP.',           unit:'Bidang Usaha Mikro' },
                { name:'Bernadheta Gezia Arine, S.E.',           unit:'Bidang Usaha Mikro' },
                { name:'Gita Putri Andikawati, S.E.',            unit:'Bidang Usaha Mikro' }
            ]
        },
        {
            id:'kewirausahaan', evaluator:'Hana Fais Prabowo, S.T.P., M.Si.', unitLabel:'Bidang Kewirausahaan',
            people:[
                { name:'Ratna Listiyani, S.Si.',          unit:'Bidang Kewirausahaan' },
                { name:'Muhammad Daud Ramadhan, S.H.',    unit:'Bidang Kewirausahaan' },
                { name:'Nanda Kesuma Devi, S.I.A.',       unit:'Bidang Kewirausahaan' },
                { name:'Rosalia Kurnia Handari, S.T.P.',  unit:'Bidang Kewirausahaan' },
                { name:'Pancais Meysir Kusdanarko, S.E.', unit:'Bidang Kewirausahaan' },
                { name:'Annisa Sulcha Afifah, S.Kom.',    unit:'Bidang Kewirausahaan' },
                { name:'Endah Febriasih, S.A.B.',         unit:'Bidang Kewirausahaan' }
            ]
        },
        {
            id:'blut', evaluator:'Wisnu Hermawan, S.P., M.T.', unitLabel:'Balai Layanan Usaha Terpadu KUMKM',
            people:[
                { name:'Aribowo, S.Pi., M.Eng.',    unit:'Balai Layanan Usaha Terpadu KUMKM' },
                { name:'Kuntarta, S.Sos., M.AP',    unit:'Balai Layanan Usaha Terpadu KUMKM' },
                { name:'Hana Budi Setyowati, S.T.', unit:'Balai Layanan Usaha Terpadu KUMKM' }
            ]
        }
    ];

    // ── STATE ──
    var state = {
        month: MONTHS[new Date().getMonth()],
        search:'', groupFilter:'', statusFilter:'',
        records:{}, teamScores:{},
        diklatScores:{},
        diklatLoaded: false,
        currentUser: null, loading: false
    };

    // ══════════════════════════════════════════════════════════
    // STORAGE
    // ══════════════════════════════════════════════════════════
    function loadRecords() {
        try { state.records = JSON.parse(localStorage.getItem(DATA_KEY) || '{}'); }
        catch(e) { state.records = {}; }
    }
    function saveRecords() {
        try { localStorage.setItem(DATA_KEY, JSON.stringify(state.records)); }
        catch(e) { console.warn('[PPO] localStorage penuh'); }
    }
    function getRec(personPid) { return (state.records[state.month] || {})[personPid] || null; }
    function setRec(personPid, rec) {
        if (!state.records[state.month]) state.records[state.month] = {};
        state.records[state.month][personPid] = rec;
        saveRecords();
    }
    function delRec(personPid) {
        if (state.records[state.month] && state.records[state.month][personPid]) {
            delete state.records[state.month][personPid];
            saveRecords();
        }
    }
    function getCurrentYearString() { return String(new Date().getFullYear()); }

    // ── DIKLAT CACHE ──
    function saveDiklatCache(scores) {
        try { localStorage.setItem(DIKLAT_CACHE_KEY, JSON.stringify({ scores:scores, timestamp:Date.now() })); }
        catch(e) {}
    }
    function loadDiklatCache() {
        try {
            var raw = JSON.parse(localStorage.getItem(DIKLAT_CACHE_KEY) || 'null');
            if (!raw || !raw.scores) return null;
            if (Date.now() - (raw.timestamp||0) > 3600000) return null;
            return raw.scores;
        } catch(e) { return null; }
    }

    function fetchDiklatScores() {
        if (window.diklatGetMasterData) {
            var md = window.diklatGetMasterData();
            if (md && md.length > 0) return Promise.resolve(_buildDiklatMap(md));
        }
        var cached = loadDiklatCache();
        if (cached) return Promise.resolve(cached);
        var urlOp = getOperasionalUrl();
        if (!urlOp) { return Promise.resolve({}); }
        return new Promise(function(resolve) {
            var cb='__ppoDiklat_'+Date.now()+'_'+Math.floor(Math.random()*99999);
            var done=false, script=document.createElement('script');
            var timer=setTimeout(function(){ if(done)return; cleanup(); resolve({}); }, 15000);
            function cleanup(){ done=true; clearTimeout(timer); try{delete window[cb];}catch(e){} if(script.parentNode)script.parentNode.removeChild(script); }
            window[cb]=function(data){
                cleanup();
                if(data&&data.status==='success'&&Array.isArray(data.diklat)){
                    var scores=_buildDiklatMap(data.diklat); saveDiklatCache(scores); resolve(scores);
                } else { resolve({}); }
            };
            script.onerror=function(){ if(done)return; cleanup(); resolve({}); };
            script.src=urlOp+'?action=getDiklat&callback='+cb;
            document.head.appendChild(script);
        });
    }

    function _buildDiklatMap(diklatList) {
        var TRIWULAN_KEYS=['triwulan1','triwulan2','triwulan3','triwulan4'];
        var map={};
        diklatList.forEach(function(d){
            var nama=(d.nama||'').toLowerCase().trim();
            if(!nama) return;
            var hasAny=TRIWULAN_KEYS.some(function(k){
                var val=d[k];
                if(!val) return false;
                if(typeof val==='object') return !!(val.link||val.fileName||val.fileDataUrl);
                return String(val).trim()!=='';
            });
            map[nama]=hasAny;
        });
        return map;
    }

    function getDiklatValue(personName) {
        if(!state.diklatLoaded) return null;
        var key=(personName||'').toLowerCase().trim();
        if(state.diklatScores[key]===true)  return 10;
        if(state.diklatScores[key]===false) return 0;
        return 0;
    }

    // ── TEAM CACHE ──
    function loadTeamCacheMonth(month) {
        try {
            var cached=JSON.parse(localStorage.getItem(TEAM_CACHE_KEY)||'{}');
            return (cached[month]&&cached[month].scores)?cached[month].scores:{};
        } catch(e){ return {}; }
    }
    function saveTeamCacheMonth(month, scores) {
        if(window.PPO_GAS_CONFIG&&window.PPO_GAS_CONFIG.saveTeamScoresToCache){
            window.PPO_GAS_CONFIG.saveTeamScoresToCache(month,scores);
        } else {
            try {
                var cached=JSON.parse(localStorage.getItem(TEAM_CACHE_KEY)||'{}');
                cached[month]={scores:scores||{},timestamp:Date.now()};
                localStorage.setItem(TEAM_CACHE_KEY,JSON.stringify(cached));
            } catch(e){}
        }
    }

    // ── JSONP ──
    function gasJsonp(params) {
        return new Promise(function(resolve,reject){
            var gasUrl=getGasUrl();
            if(!gasUrl){reject(new Error('URL GAS belum diatur'));return;}
            var cb='__ppoGas_'+Date.now()+'_'+Math.floor(Math.random()*9999);
            var done=false, script=document.createElement('script');
            var timeout=setTimeout(function(){ if(done)return; cleanup(); reject(new Error('Timeout 20 detik')); },20000);
            function cleanup(){ done=true; clearTimeout(timeout); try{delete window[cb];}catch(e){} if(script.parentNode)script.parentNode.removeChild(script); }
            window[cb]=function(data){ cleanup(); resolve(data); };
            script.onerror=function(){ if(done)return; cleanup(); reject(new Error('Network error')); };
            var qs=Object.keys(params||{}).map(function(k){ return encodeURIComponent(k)+'='+encodeURIComponent(params[k]); }).join('&');
            script.src=gasUrl+'?'+qs+'&callback='+cb;
            document.head.appendChild(script);
        });
    }

    function findPersonByPid(personPid) {
        var found=null;
        GROUPS.some(function(g){
            var p=g.people.find(function(pp){ return pid(g.id,pp.name)===personPid; });
            if(p){ found={group:g,person:p}; return true; }
        });
        return found;
    }

    function mapGasRecordToLocal(rec) {
        var criteria=(rec.criteria&&typeof rec.criteria==='object')?rec.criteria:{};
        var diklatFromGas=parseFloat(rec.diklat)||0;
        var skorTim=parseFloat(rec.skorTim)||0;
        var bobotTim=parseFloat(rec.bobotTim)||+(skorTim*0.60).toFixed(2);
        var nilaiAkhlak=parseFloat(rec.nilaiAkhlak)||0;
        var total=parseFloat(rec.total)||+(bobotTim+nilaiAkhlak+diklatFromGas).toFixed(2);
        return {
            month:rec.bulan||state.month, gid:rec.gid||'', evaluator:rec.penilai||'',
            name:rec.nama||'', unit:rec.unit||'', criteria:criteria,
            diklat:diklatFromGas, teamScore:skorTim,
            summary:{teamW:bobotTim,akhlakW:nilaiAkhlak,diklatW:diklatFromGas,total:total},
            updatedAt:rec.updatedAt||new Date().toISOString(), updatedBy:rec.updatedBy||'Admin'
        };
    }

    // ══════════════════════════════════════════════════════════
    // loadFromGAS
    // ══════════════════════════════════════════════════════════
    function loadFromGAS() {
        var gasUrl=getGasUrl();
        if(!gasUrl){ return Promise.resolve(); }
        setLoadingState(true);
        var bulan=state.month, tahun=getCurrentYearString();

        var pDiklat=fetchDiklatScores().then(function(scores){
            state.diklatScores=scores||{}; state.diklatLoaded=true;
        }).catch(function(){ state.diklatLoaded=true; });

        var pTeam;
        if(window.PPO_GAS_CONFIG&&window.PPO_GAS_CONFIG.fetchAllTeamScores){
            pTeam=window.PPO_GAS_CONFIG.fetchAllTeamScores(bulan)
                .then(function(allScores){
                    state.teamScores=allScores||{};
                    saveTeamCacheMonth(bulan,state.teamScores);
                    _updateAutoLoadStatus('Skor tim berhasil dimuat','success');
                })
                .catch(function(err){
                    var cached=loadTeamCacheMonth(bulan);
                    if(Object.keys(cached).length>0){
                        state.teamScores=cached;
                        _updateAutoLoadStatus('Skor tim dari cache lokal','warning');
                    } else {
                        _updateAutoLoadStatus('Skor tim belum tersedia','info');
                    }
                });
        } else {
            pTeam=gasJsonp({action:'getTeamScores',bulan:bulan,tahun:tahun})
                .then(function(teamRes){
                    if(teamRes&&teamRes.status==='success'&&teamRes.scores){
                        state.teamScores=teamRes.scores;
                        saveTeamCacheMonth(bulan,teamRes.scores);
                        _updateAutoLoadStatus('Skor tim berhasil dimuat','success');
                    }
                })
                .catch(function(){
                    var cached=loadTeamCacheMonth(bulan);
                    if(Object.keys(cached).length>0) state.teamScores=cached;
                });
        }

        var pData=gasJsonp({action:'getAllPenilaian',bulan:bulan,tahun:tahun})
            .then(function(penilaianRes){
                if(penilaianRes&&penilaianRes.status==='success'&&Array.isArray(penilaianRes.records)){
                    if(!state.records[bulan]) state.records[bulan]={};
                    penilaianRes.records.forEach(function(rec){
                        if(!rec.gid||!rec.nama) return;
                        var recPid=pid(rec.gid,rec.nama);
                        state.records[bulan][recPid]=mapGasRecordToLocal(rec);
                    });
                    saveRecords();
                }
            })
            .catch(function(err){
                if(window.showToast) showToast('Gagal sinkronisasi: '+err.message,'error');
            });

        return Promise.all([pDiklat,pTeam,pData]).finally(function(){
            setLoadingState(false); render();
        });
    }

    function _updateAutoLoadStatus(msg, type) {
        var el=document.getElementById('ppo-status-msg');
        var dot=document.getElementById('ppo-status-dot');
        if(!el) return;
        el.textContent=msg;
        var colors={success:'#10b981',warning:'#f59e0b',info:'#6b7280',error:'#ef4444'};
        if(dot) dot.style.background=colors[type]||colors.info;
    }

    function setLoadingState(on) {
        state.loading=on;
        var btn=document.getElementById('ppo-btn-refresh');
        if(!btn) return;
        btn.disabled=on;
        btn.innerHTML=on
            ?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="ppo-spin"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Memuat...'
            :'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Refresh';
    }

    // ── SAVE / DELETE GAS ──
    function saveToGAS(personPid, rec) {
        var found=findPersonByPid(personPid);
        if(!found) return Promise.reject(new Error('Pegawai tidak ditemukan: '+personPid));
        var payload={
            bulan:state.month, tahun:getCurrentYearString(),
            gid:found.group.id, penilai:found.group.evaluator,
            namaPegawai:found.person.name, unit:found.person.unit,
            criteria:rec.criteria||{}, diklat:rec.diklat||0, skorTim:rec.teamScore||0,
            updatedBy:state.currentUser?(state.currentUser.name||'Admin'):'Admin', catatan:''
        };
        if(window.PPO_GAS_CONFIG&&window.PPO_GAS_CONFIG.savePenilaian) return window.PPO_GAS_CONFIG.savePenilaian(payload);
        var gasUrl=getGasUrl();
        if(!gasUrl) return Promise.resolve({status:'skipped'});
        return new Promise(function(resolve,reject){
            var body=Object.assign({action:'savePenilaian'},payload);
            body.criteria=JSON.stringify(body.criteria);
            var cb='__ppoSave_'+Date.now()+'_'+Math.floor(Math.random()*9999);
            var done=false, script=document.createElement('script');
            var timer=setTimeout(function(){ if(done)return; cleanup(); reject(new Error('Timeout simpan')); },20000);
            function cleanup(){ done=true; clearTimeout(timer); try{delete window[cb];}catch(e){} if(script.parentNode)script.parentNode.removeChild(script); }
            window[cb]=function(data){ cleanup(); resolve(data); };
            script.onerror=function(){ if(done)return; cleanup(); reject(new Error('Network error')); };
            script.src=gasUrl+'?jsonBody='+encodeURIComponent(JSON.stringify(body))+'&callback='+cb;
            document.head.appendChild(script);
        });
    }

    function deleteFromGAS(personPid) {
        var found=findPersonByPid(personPid);
        if(!found) return Promise.reject(new Error('Pegawai tidak ditemukan: '+personPid));
        var payload={
            bulan:state.month, gid:found.group.id, namaPegawai:found.person.name,
            deletedBy:state.currentUser?(state.currentUser.name||'Admin'):'Admin'
        };
        if(window.PPO_GAS_CONFIG&&window.PPO_GAS_CONFIG.deletePenilaian) return window.PPO_GAS_CONFIG.deletePenilaian(payload);
        var gasUrl=getGasUrl();
        if(!gasUrl) return Promise.resolve({status:'skipped'});
        return new Promise(function(resolve,reject){
            var body=Object.assign({action:'deletePenilaian'},payload);
            var cb='__ppoDel_'+Date.now()+'_'+Math.floor(Math.random()*9999);
            var done=false, script=document.createElement('script');
            var timer=setTimeout(function(){ if(done)return; cleanup(); reject(new Error('Timeout hapus')); },20000);
            function cleanup(){ done=true; clearTimeout(timer); try{delete window[cb];}catch(e){} if(script.parentNode)script.parentNode.removeChild(script); }
            window[cb]=function(data){ cleanup(); resolve(data); };
            script.onerror=function(){ if(done)return; cleanup(); reject(new Error('Network error')); };
            script.src=gasUrl+'?jsonBody='+encodeURIComponent(JSON.stringify(body))+'&callback='+cb;
            document.head.appendChild(script);
        });
    }

    // ══════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════
    function slug(s){ return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
    function pid(gid,name){ return gid+'::'+slug(name); }
    function monthLabel(m){ return MONTH_LABELS[String(m||'').trim().toUpperCase()]||m||'—'; }
    function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
    function escJs(s){ return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

    // Unit color system - refined palette
    var UNIT_PALETTE = {
        'Sekretariat':                        { bg:'#EFF6FF', color:'#1D4ED8', letter:'S' },
        'Bidang Koperasi':                    { bg:'#FEF3C7', color:'#B45309', letter:'K' },
        'Bidang UKM':                         { bg:'#DCFCE7', color:'#15803D', letter:'U' },
        'Bidang Usaha Mikro':                 { bg:'#F3E8FF', color:'#7E22CE', letter:'M' },
        'Bidang Kewirausahaan':               { bg:'#FEE2E2', color:'#B91C1C', letter:'W' },
        'Balai Layanan Usaha Terpadu KUMKM':  { bg:'#E0F2FE', color:'#075985', letter:'B' }
    };
    function unitPalette(unit){ return UNIT_PALETTE[unit]||{bg:'#F1F5F9',color:'#475569',letter:'?'}; }
    function initials(name){
        return String(name||'').split(' ').filter(function(w){return w.length>0;})
            .slice(0,2).map(function(w){return w[0].toUpperCase();}).join('');
    }

    // ── AUTH ──
    function getUser() {
        var u=null;
        if(window.AUTH&&typeof AUTH.getUser==='function') u=AUTH.getUser();
        if(!u){ try{ u=JSON.parse(localStorage.getItem('user')||'null'); }catch(e){} }
        if(!u) return null;
        u._role=(window.AUTH&&typeof AUTH.normalizeRole==='function')
            ?AUTH.normalizeRole(u.role)||''
            :String(u.role||'').toLowerCase().trim();
        return u;
    }
    function isAdmin()   { var u=state.currentUser; return !!(u&&u._role==='superadmin'); }
    function isProgram() { var u=state.currentUser; return !!(u&&u._role==='program'); }

    function getAllowedGids() {
        var u=state.currentUser;
        if(!u) return [];
        var role=u._role;
        if(role==='superadmin'||role==='program') return null;
        if(ROLE_TO_GID[role]) return [ROLE_TO_GID[role]];
        var derived=deriveGidFromUser(u);
        if(derived) return [derived];
        return [];
    }

    function deriveGidFromUser(u) {
        if(!u||!u.name) return null;
        var uNameLower=u.name.toLowerCase().trim();
        var found=GROUPS.find(function(g){ return g.evaluator.toLowerCase()===uNameLower; });
        if(found) return found.id;
        var uNameNoGelar=uNameLower.split(',')[0].trim();
        found=GROUPS.find(function(g){ return g.evaluator.toLowerCase().split(',')[0].trim()===uNameNoGelar; });
        if(found) return found.id;
        var uWords=uNameNoGelar.split(/\s+/).filter(function(w){return w.length>=3;});
        if(uWords.length>0){
            found=GROUPS.find(function(g){
                var evalLower=g.evaluator.toLowerCase();
                return uWords.every(function(w){return evalLower.indexOf(w)!==-1;});
            });
            if(found) return found.id;
        }
        var firstWord=uNameNoGelar.split(' ')[0];
        if(firstWord&&firstWord.length>=4){
            found=GROUPS.find(function(g){ return g.evaluator.toLowerCase().indexOf(firstWord)!==-1; });
            if(found) return found.id;
        }
        return null;
    }

    function canEditGroup(gid) {
        if(isAdmin()||isProgram()) return true;
        var allowedGids=getAllowedGids();
        if(allowedGids===null) return true;
        return allowedGids.indexOf(gid)!==-1;
    }

    // ── KALKULASI ──
    function getTeamScore(unit) {
        var s=state.teamScores[unit];
        if(!s) return null;
        if(s.total!==undefined&&!isNaN(parseFloat(s.total))) return +parseFloat(s.total).toFixed(2);
        var keys=['bbm','kendaraan','ruang','kearsipan','spj','monev'];
        var total=0, hasAny=false;
        keys.forEach(function(k){ var v=parseFloat(s[k]); if(!isNaN(v)){total+=v;hasAny=true;} });
        return hasAny?+total.toFixed(2):null;
    }

    function calcAkhlak(criteria) {
        var vals=AKHLAK.map(function(a){
            var v=parseFloat(criteria&&criteria[a.key]);
            return isNaN(v)?7:Math.min(10,Math.max(7,v));
        });
        var avg=vals.reduce(function(a,b){return a+b;},0)/AKHLAK.length;
        return {avg:+avg.toFixed(2),weighted:+(avg*3).toFixed(2)};
    }

    function calcFinal(teamScore, akhlakAvg, diklat) {
        var t=parseFloat(teamScore)||0, a=parseFloat(akhlakAvg)||7, d=parseFloat(diklat)||0;
        return {
            teamW:+(t*0.60).toFixed(2), akhlakW:+(a*3).toFixed(2),
            diklatW:+(d*1).toFixed(2), total:+(t*0.60+a*3+d).toFixed(2)
        };
    }

    function statusOf(total) {
        if(total>=90) return {label:'Amat Baik',  cls:'ppo-s-great', color:'#15803D', bg:'#DCFCE7'};
        if(total>=80) return {label:'Baik',        cls:'ppo-s-good',  color:'#1D4ED8', bg:'#DBEAFE'};
        if(total>=70) return {label:'Cukup Baik',  cls:'ppo-s-fair',  color:'#B45309', bg:'#FEF3C7'};
        return               {label:'Perlu Pembinaan', cls:'ppo-s-low', color:'#B91C1C', bg:'#FEE2E2'};
    }

    function snap(personPid, personName, unit) {
        var rec=getRec(personPid), ts=getTeamScore(unit);
        var criteria=rec&&rec.criteria?rec.criteria:{};
        var akhlak=calcAkhlak(criteria);
        var diklatVal=getDiklatValue(personName);
        var diklat=diklatVal!==null?diklatVal:(rec&&rec.diklat!=null?rec.diklat:0);
        var final=calcFinal(ts,akhlak.avg,diklat);
        return {
            rec:rec, ts:ts, akhlak:akhlak, diklat:diklat, diklatLoaded:state.diklatLoaded, final:final,
            status:rec?statusOf(final.total):{label:'Belum Dinilai',cls:'ppo-s-pending',color:'#6B7280',bg:'#F3F4F6'}
        };
    }

    function visibleGroups() {
        var allowedGids=getAllowedGids();
        if(allowedGids===null) return GROUPS;
        if(allowedGids.length===0) return [];
        return GROUPS.filter(function(g){return allowedGids.indexOf(g.id)!==-1;});
    }
    function allVisiblePeople() {
        var rows=[];
        visibleGroups().forEach(function(g){
            g.people.forEach(function(p){
                rows.push({gid:g.id,evaluator:g.evaluator,unitLabel:g.unitLabel,name:p.name,unit:p.unit,pid:pid(g.id,p.name)});
            });
        });
        return rows;
    }
    function filteredPeople() {
        var q=(state.search||'').toLowerCase(), gf=state.groupFilter||'', sf=state.statusFilter||'';
        return allVisiblePeople().filter(function(p){
            if(q&&!p.name.toLowerCase().includes(q)&&!p.unit.toLowerCase().includes(q)) return false;
            if(gf&&p.gid!==gf) return false;
            var rec=getRec(p.pid);
            if(sf==='done'&&!rec) return false;
            if(sf==='draft'&&rec) return false;
            return true;
        });
    }

    // SVG Icons — refined set
    var IC = {
        edit:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        eye:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        refresh:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
        users:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        check:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        chart:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        star:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        lock:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        search:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        close:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        filter:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
        info:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    };

    // ══════════════════════════════════════════════════════════
    // RENDER STATS
    // ══════════════════════════════════════════════════════════
    function renderStats() {
        var people=allVisiblePeople(), done=0, totals=[], akhlaks=[];
        people.forEach(function(p){
            var s=snap(p.pid,p.name,p.unit);
            if(s.rec){ done++; if(!isNaN(s.final.total)) totals.push(s.final.total); akhlaks.push(s.akhlak.avg); }
        });
        var avgT=totals.length  ?+(totals.reduce(function(a,b){return a+b;},0)/totals.length).toFixed(1):0;
        var avgA=akhlaks.length ?+(akhlaks.reduce(function(a,b){return a+b;},0)/akhlaks.length).toFixed(1):0;
        var pct=people.length?Math.round(done/people.length*100):0;
        var el=document.getElementById('ppo-stat-grid');
        if(!el) return;

        el.innerHTML=
            '<div class="stat-card" style="border-left:4px solid #2563EB;">'+
                '<div class="stat-label">Total Pegawai</div>'+
                '<div class="stat-value">'+people.length+'</div>'+
                '<div class="stat-footer">Dalam tanggung jawab Anda</div>'+
            '</div>'+
            '<div class="stat-card" style="border-left:4px solid #10b981;">'+
                '<div class="stat-label">Sudah Dinilai</div>'+
                '<div class="stat-value">'+done+'</div>'+
                '<div class="stat-footer">'+pct+'% dari total pegawai'+
                    '<div class="ppo-prog-track" style="margin-top:8px;"><div class="ppo-prog-fill" style="width:'+pct+'%"></div></div>'+
                '</div>'+
            '</div>'+
            '<div class="stat-card" style="border-left:4px solid #D97706;">'+
                '<div class="stat-label">Rata-rata Nilai</div>'+
                '<div class="stat-value">'+(avgT||'—')+'</div>'+
                '<div class="stat-footer">Nilai akhir /100</div>'+
            '</div>'+
            '<div class="stat-card" style="border-left:4px solid #9333EA;">'+
                '<div class="stat-label">Rata-rata AKHLAK</div>'+
                '<div class="stat-value">'+(avgA||'—')+'</div>'+
                '<div class="stat-footer">Skala 7 – 10</div>'+
            '</div>';
    }

    // ══════════════════════════════════════════════════════════
    // RENDER TABLE
    // ══════════════════════════════════════════════════════════
    function renderTable() {
        var people=filteredPeople();
        var tbody=document.getElementById('ppo-tbody');
        var mobileList=document.getElementById('ppo-mobile-list');
        var colEval=document.getElementById('ppo-col-evaluator');
        if(!tbody) return;
        var showEvalCol=isAdmin()||isProgram();
        if(colEval) colEval.style.display=showEvalCol?'':'none';

        // Update subtitle
        var sub=document.getElementById('ppo-table-count');
        if(sub) sub.textContent=people.length+' pegawai · '+monthLabel(state.month);

        var html='', lastGid='';
        people.forEach(function(p, i){
            var s=snap(p.pid,p.name,p.unit);
            var pal=unitPalette(p.unit);
            var ini=initials(p.name);
            var ts=s.ts!==null?s.ts.toFixed(1):'—';
            var ak=s.rec?s.akhlak.avg.toFixed(1):'—';
            var tot=s.rec?s.final.total.toFixed(1):'—';
            var canEdit=canEditGroup(p.gid);

            var dkHtml;
            if(!s.diklatLoaded){
                dkHtml='<span class="ppo-dk-load">···</span>';
            } else {
                dkHtml=s.diklat===10
                    ?'<span class="ppo-dk-yes">✓&nbsp;10</span>'
                    :'<span class="ppo-dk-no">✗&nbsp;'+s.diklat+'</span>';
            }

            // Group header row for admin view
            if(showEvalCol&&p.gid!==lastGid){
                var grp=GROUPS.find(function(g){return g.id===p.gid;});
                if(grp){
                    html+='<tr class="ppo-group-hdr"><td colspan="10">'+
                        '<span class="ppo-group-hdr-label">'+esc(grp.evaluator)+'</span>'+
                        '<span class="ppo-group-hdr-unit">'+esc(grp.unitLabel)+'</span>'+
                    '</td></tr>';
                }
                lastGid=p.gid;
            }

            var actionHtml='<div class="ppo-actions">';
            if(canEdit){
                actionHtml+='<button onclick="ppoOpenModal(\''+escJs(p.pid)+'\')" class="ppo-act-btn ppo-act-edit" title="'+(s.rec?'Edit':'Nilai')+'">'+IC.edit+'</button>';
            }
            if(s.rec){
                actionHtml+='<button onclick="ppoOpenModalView(\''+escJs(p.pid)+'\')" class="ppo-act-btn ppo-act-view" title="Lihat">'+IC.eye+'</button>';
            }
            actionHtml+='</div>';

            html+=
                '<tr class="ppo-row">'+
                '<td class="ppo-td-no">'+(i+1)+'</td>'+
                '<td class="ppo-td-name">'+
                    '<div class="ppo-person-cell">'+
                        '<div class="ppo-avatar" style="background:'+pal.bg+';color:'+pal.color+';">'+ini+'</div>'+
                        '<div class="ppo-person-info">'+
                            '<span class="ppo-person-name">'+esc(p.name)+'</span>'+
                            '<span class="ppo-person-unit">'+esc(p.unit)+'</span>'+
                        '</div>'+
                    '</div>'+
                '</td>'+
                '<td class="ppo-td-unit"><span class="ppo-unit-chip" style="background:'+pal.bg+';color:'+pal.color+';">'+esc(unitShort(p.unit))+'</span></td>'+
                (showEvalCol?'<td class="ppo-td-eval">'+esc(p.evaluator.split(',')[0])+'</td>':'')+
                '<td class="ppo-td-num'+(s.ts===null?' ppo-dim':'')+'">'+ts+'</td>'+
                '<td class="ppo-td-num'+(s.rec?'':' ppo-dim')+'">'+ak+'</td>'+
                '<td class="ppo-td-dik">'+dkHtml+'</td>'+
                '<td class="ppo-td-total'+(s.rec?' ppo-total-val':' ppo-dim')+'">'+tot+'</td>'+
                '<td class="ppo-td-status"><span class="ppo-status-badge" style="background:'+s.status.bg+';color:'+s.status.color+';">'+s.status.label+'</span></td>'+
                '<td class="ppo-td-action">'+actionHtml+'</td>'+
                '</tr>';
        });

        if(!html){
            html='<tr><td colspan="10" class="ppo-empty">Tidak ada data yang sesuai filter.</td></tr>';
        }
        tbody.innerHTML=html;

        // Mobile card list
        if(mobileList){
            var mHtml='';
            people.forEach(function(p){
                var s=snap(p.pid,p.name,p.unit);
                var pal=unitPalette(p.unit);
                var ini=initials(p.name);
                var ts=s.ts!==null?s.ts.toFixed(1):'—';
                var tot=s.rec?s.final.total.toFixed(1):'—';
                var canEdit=canEditGroup(p.gid);

                mHtml+='<div class="ppo-mcard">'+
                    '<div class="ppo-mcard-top">'+
                        '<div class="ppo-avatar ppo-avatar-lg" style="background:'+pal.bg+';color:'+pal.color+';">'+ini+'</div>'+
                        '<div class="ppo-mcard-info">'+
                            '<div class="ppo-mcard-name">'+esc(p.name)+'</div>'+
                            '<div class="ppo-mcard-unit">'+esc(p.unit)+'</div>'+
                        '</div>'+
                        '<span class="ppo-status-badge" style="background:'+s.status.bg+';color:'+s.status.color+';">'+s.status.label+'</span>'+
                    '</div>'+
                    '<div class="ppo-mcard-scores">'+
                        '<div class="ppo-mscore"><div class="ppo-mscore-label">Tim (60%)</div><div class="ppo-mscore-val">'+ts+'</div></div>'+
                        '<div class="ppo-mscore"><div class="ppo-mscore-label">AKHLAK</div><div class="ppo-mscore-val">'+(s.rec?s.akhlak.avg.toFixed(1):'—')+'</div></div>'+
                        '<div class="ppo-mscore"><div class="ppo-mscore-label">Diklat</div><div class="ppo-mscore-val">'+(s.diklatLoaded?s.diklat:'···')+'</div></div>'+
                        '<div class="ppo-mscore ppo-mscore-total"><div class="ppo-mscore-label">Nilai Akhir</div><div class="ppo-mscore-val ppo-mscore-big">'+tot+'</div></div>'+
                    '</div>'+
                    '<div class="ppo-mcard-actions">'+
                        (canEdit?'<button onclick="ppoOpenModal(\''+escJs(p.pid)+'\')" class="ppo-mbtn ppo-mbtn-edit">'+IC.edit+(s.rec?' Edit Penilaian':' Mulai Nilai')+'</button>':'')+
                        (s.rec?'<button onclick="ppoOpenModalView(\''+escJs(p.pid)+'\')" class="ppo-mbtn ppo-mbtn-view">'+IC.eye+' Lihat Detail</button>':'')+
                    '</div>'+
                '</div>';
            });
            if(!mHtml) mHtml='<div class="ppo-empty" style="padding:40px;text-align:center;">Tidak ada data.</div>';
            mobileList.innerHTML=mHtml;
        }
    }

    function unitShort(unit) {
        var map = {
            'Sekretariat':'Sekretariat',
            'Bidang Koperasi':'B. Koperasi',
            'Bidang UKM':'B. UKM',
            'Bidang Usaha Mikro':'B. Usaha Mikro',
            'Bidang Kewirausahaan':'B. Kewirausahaan',
            'Balai Layanan Usaha Terpadu KUMKM':'BLUT KUMKM'
        };
        return map[unit]||unit;
    }

    // ══════════════════════════════════════════════════════════
    // RENDER REKAP
    // ══════════════════════════════════════════════════════════
    function renderRekap() {
        var tbody=document.getElementById('ppo-rekap-tbody');
        if(!tbody) return;
        var html='';
        UNITS.forEach(function(unit){
            var people=allVisiblePeople().filter(function(p){return p.unit===unit;});
            if(!people.length) return;
            var done=0, tots=[], akhs=[], dks=[];
            people.forEach(function(p){
                var s=snap(p.pid,p.name,p.unit);
                if(s.rec){done++; if(!isNaN(s.final.total)) tots.push(s.final.total); akhs.push(s.akhlak.avg); dks.push(s.diklat);}
            });
            var avgT=tots.length?+(tots.reduce(function(a,b){return a+b;},0)/tots.length).toFixed(1):'—';
            var avgA=akhs.length?+(akhs.reduce(function(a,b){return a+b;},0)/akhs.length).toFixed(1):'—';
            var avgD=dks.length ?+(dks.reduce(function(a,b){return a+b;},0)/dks.length).toFixed(1) :'—';
            var pct=Math.round(done/people.length*100);
            var pal=unitPalette(unit);
            html+='<tr>'+
                '<td><div style="display:flex;align-items:center;gap:8px;">'+
                    '<div style="width:6px;height:28px;border-radius:3px;background:'+pal.color+';flex-shrink:0;"></div>'+
                    '<span style="font-size:13px;font-weight:600;color:#1E293B;">'+esc(unit)+'</span>'+
                '</div></td>'+
                '<td class="ppo-td-center">'+people.length+'</td>'+
                '<td class="ppo-td-center">'+done+'</td>'+
                '<td>'+
                    '<div style="display:flex;align-items:center;gap:8px;">'+
                        '<div style="flex:1;height:4px;background:#F1F5F9;border-radius:2px;overflow:hidden;">'+
                            '<div style="height:100%;width:'+pct+'%;background:'+pal.color+';border-radius:2px;"></div>'+
                        '</div>'+
                        '<span style="font-size:12px;color:#64748B;min-width:30px;">'+pct+'%</span>'+
                    '</div>'+
                '</td>'+
                '<td class="ppo-td-center" style="font-weight:700;font-size:14px;">'+avgT+'</td>'+
                '<td class="ppo-td-center">'+avgA+'</td>'+
                '<td class="ppo-td-center">'+avgD+'</td>'+
                '</tr>';
        });
        if(!html) html='<tr><td colspan="7" class="ppo-empty">Belum ada data.</td></tr>';
        tbody.innerHTML=html;
    }

    // ══════════════════════════════════════════════════════════
    // RENDER RANKING
    // ══════════════════════════════════════════════════════════
    function renderRanking() {
        var el=document.getElementById('ppo-ranking-list');
        if(!el) return;
        var ranked=[];
        allVisiblePeople().forEach(function(p){
            var s=snap(p.pid,p.name,p.unit);
            if(s.rec&&!isNaN(s.final.total)) ranked.push({name:p.name,unit:p.unit,total:s.final.total,status:s.status});
        });
        ranked.sort(function(a,b){return b.total-a.total;});
        if(!ranked.length){ el.innerHTML='<p class="ppo-empty" style="padding:40px;">Belum ada data.</p>'; return; }

        var MEDAL=['🥇','🥈','🥉'];
        el.innerHTML=ranked.slice(0,25).map(function(r,i){
            var pal=unitPalette(r.unit);
            var ini=initials(r.name);
            return '<div class="ppo-rank-row">'+
                '<div class="ppo-rank-pos">'+(i<3?MEDAL[i]:'<span class="ppo-rank-num">'+(i+1)+'</span>')+'</div>'+
                '<div class="ppo-avatar ppo-avatar-sm" style="background:'+pal.bg+';color:'+pal.color+';">'+ini+'</div>'+
                '<div class="ppo-rank-info">'+
                    '<div class="ppo-rank-name">'+esc(r.name)+'</div>'+
                    '<div class="ppo-rank-unit">'+esc(r.unit)+'</div>'+
                '</div>'+
                '<span class="ppo-status-badge" style="background:'+r.status.bg+';color:'+r.status.color+';">'+r.status.label+'</span>'+
                '<div class="ppo-rank-score">'+r.total.toFixed(1)+'</div>'+
            '</div>';
        }).join('');
    }

    function render() {
        renderStats(); renderTable();
        var rp=document.getElementById('ppo-panel-rekap');   if(rp &&rp.style.display!=='none') renderRekap();
        var rnk=document.getElementById('ppo-panel-ranking'); if(rnk&&rnk.style.display!=='none') renderRanking();
    }

    // ══════════════════════════════════════════════════════════
    // MODAL PENILAIAN — v5.0 redesign
    // ══════════════════════════════════════════════════════════
    var _activePid=null, _modalReadOnly=false;

    function openModalView(personPid){ _modalReadOnly=true; openModal(personPid,true); }

    function openModal(personPid, readOnly) {
        var person=null, group=null;
        GROUPS.some(function(g){
            var p=g.people.find(function(pp){return pid(g.id,pp.name)===personPid;});
            if(p){person=p;group=g;return true;}
        });
        if(!person){if(window.showToast)showToast('Pegawai tidak ditemukan.','error');return;}
        var isReadOnly=readOnly||false;
        if(!isReadOnly&&!canEditGroup(group.id)){if(window.showToast)showToast('Tidak memiliki akses.','error');return;}
        _activePid=personPid; _modalReadOnly=isReadOnly;

        var rec=getRec(personPid);
        var criteria=rec&&rec.criteria?rec.criteria:{};
        var diklatVal=getDiklatValue(person.name);
        var diklat=diklatVal!==null?diklatVal:(rec&&rec.diklat!=null?rec.diklat:0);
        var ts=getTeamScore(person.unit);
        var akhlak=calcAkhlak(criteria);
        var final=calcFinal(ts,akhlak.avg,diklat);
        var sts=rec?statusOf(final.total):{label:'Belum Dinilai',color:'#6B7280',bg:'#F3F4F6'};
        var pal=unitPalette(person.unit);
        var ini=initials(person.name);

        // Diklat display
        var diklatChip=!state.diklatLoaded
            ?'<span class="ppo-chip-loading">Memuat...</span>'
            :(diklat===10
                ?'<span class="ppo-chip-yes">Sudah upload diklat → 10</span>'
                :'<span class="ppo-chip-no">Belum upload diklat → 0</span>');

        // Akhlak items
        var akhlakHTML=AKHLAK.map(function(a){
            var v=parseFloat(criteria[a.key])||7; v=Math.min(10,Math.max(7,v));
            var LABELS={7:'Kurang',8:'Cukup Baik',9:'Baik',10:'Amat Baik'};
            var ctrl=isReadOnly
                ?'<div class="ppo-akhl-val">'+v+' — '+LABELS[v]+'</div>'
                :'<select data-key="'+a.key+'" onchange="ppoUpdatePreview()" class="ppo-akhl-sel">'+
                    [7,8,9,10].map(function(o){
                        return '<option value="'+o+'"'+(v==o?' selected':'')+'>'+o+' — '+LABELS[o]+'</option>';
                    }).join('')+'</select>';
            return '<div class="ppo-akhl-row">'+
                '<div class="ppo-akhl-text">'+
                    '<div class="ppo-akhl-name">'+esc(a.label)+'</div>'+
                    '<div class="ppo-akhl-desc">'+esc(a.desc)+'</div>'+
                '</div>'+
                '<div class="ppo-akhl-ctrl">'+ctrl+'</div>'+
            '</div>';
        }).join('');

        var tsRaw=state.teamScores[person.unit]||null;
        var KOMP_DEF=[
            {label:'BBM',key:'bbm',maks:5},{label:'Kendaraan',key:'kendaraan',maks:10},
            {label:'Ruang Rapat',key:'ruang',maks:5},{label:'Kearsipan',key:'kearsipan',maks:5},
            {label:'SPJ',key:'spj',maks:35},{label:'Monev',key:'monev',maks:40}
        ];

        var tsDetail=tsRaw?('<div class="ppo-ts-breakdown">'+
            KOMP_DEF.map(function(c){
                var v=parseFloat(tsRaw[c.key])||0;
                var pct=Math.round(v/c.maks*100);
                return '<div class="ppo-ts-br-row">'+
                    '<span class="ppo-ts-br-label">'+c.label+'</span>'+
                    '<div class="ppo-ts-br-bar"><div style="width:'+pct+'%"></div></div>'+
                    '<span class="ppo-ts-br-val">'+v.toFixed(1)+'<span class="ppo-ts-br-max">/'+c.maks+'</span></span>'+
                '</div>';
            }).join('')+'</div>'):'';

        var tsCtrl=!isReadOnly?(
            '<div class="ppo-ts-btns">'+
                '<button id="ppo-btn-fetch-direct" class="ppo-ts-btn-refresh" onclick="ppoFetchTeamScoreDirect(\''+escJs(person.unit)+'\')">'+IC.refresh+' Perbarui</button>'+
                '<button class="ppo-ts-btn-manual" onclick="ppoShowTeamScoreInput(\''+escJs(person.unit)+'\')">Manual</button>'+
            '</div>'+
            '<div id="ppo-ts-fetch-status" class="ppo-ts-status">'+(tsRaw?'Data dari server':'Belum ada data')+'</div>'+
            '<div id="ppo-ts-input-panel" style="display:none;margin-top:10px;" class="ppo-ts-manual-panel">'+
                '<div class="ppo-ts-manual-title">Input Manual per Komponen</div>'+
                KOMP_DEF.map(function(c){
                    var existing=tsRaw?(parseFloat(tsRaw[c.key])||0):0;
                    return '<div class="ppo-ts-input-row">'+
                        '<label>'+c.label+' <span>/'+c.maks+'</span></label>'+
                        '<input type="number" id="ppo-ts-'+c.key+'" min="0" max="'+c.maks+'" step="0.1" value="'+existing.toFixed(1)+'" oninput="ppoUpdateTeamScoreTotal()">'+
                    '</div>';
                }).join('')+
                '<div class="ppo-ts-manual-footer">'+
                    '<span>Total: <strong id="ppo-ts-manual-total">'+(ts!==null?ts.toFixed(1):'0.0')+'</strong>/100</span>'+
                    '<button onclick="ppoApplyTeamScore(\''+escJs(person.unit)+'\')" class="ppo-ts-apply-btn">Terapkan</button>'+
                '</div>'+
            '</div>'
        ):'';

        var readOnlyBadge=isReadOnly
            ?'<span class="ppo-readonly-badge">Mode Lihat</span>':'' ;

        var box=document.getElementById('ppo-modal-box');
        if(!box) return;

        box.innerHTML=
            '<div class="ppo-mhdr">'+
                '<div class="ppo-mhdr-person">'+
                    '<div class="ppo-avatar ppo-avatar-lg" style="background:'+pal.bg+';color:'+pal.color+';">'+ini+'</div>'+
                    '<div>'+
                        '<div class="ppo-mhdr-name">'+esc(person.name)+readOnlyBadge+'</div>'+
                        '<div class="ppo-mhdr-meta">'+esc(group.evaluator)+' &middot; '+esc(person.unit)+' &middot; '+monthLabel(state.month)+'</div>'+
                    '</div>'+
                '</div>'+
                '<button class="ppo-mclose" onclick="ppoCloseModal()">'+IC.close+'</button>'+
            '</div>'+

            '<div class="ppo-mbody">'+

                // LEFT COLUMN
                '<div class="ppo-mcol-left">'+
                    '<div class="ppo-mc-section-title">Komponen Penilaian</div>'+

                    // Skor Tim
                    '<div class="ppo-comp-card">'+
                        '<div class="ppo-comp-hdr">'+
                            '<div class="ppo-comp-label">Skor Tim</div>'+
                            '<div class="ppo-comp-weight">60% &middot; maks 60 poin</div>'+
                        '</div>'+
                        '<div class="ppo-comp-body">'+
                            '<div class="ppo-comp-score" id="ppo-ts-display">'+(ts!==null?ts.toFixed(1):'—')+'</div>'+
                            '<div class="ppo-comp-detail">× 0.60 = <strong id="ppo-ts-weighted">'+(ts!==null?(ts*0.60).toFixed(1):'—')+'</strong> poin</div>'+
                        '</div>'+
                        '<div id="ppo-ts-detail">'+tsDetail+'</div>'+
                        tsCtrl+
                    '</div>'+

                    // AKHLAK preview
                    '<div class="ppo-comp-card">'+
                        '<div class="ppo-comp-hdr">'+
                            '<div class="ppo-comp-label">BerAKHLAK</div>'+
                            '<div class="ppo-comp-weight">30% &middot; maks 30 poin</div>'+
                        '</div>'+
                        '<div class="ppo-comp-body">'+
                            '<div class="ppo-comp-score" id="ppo-prev-akhlak-w">'+akhlak.weighted.toFixed(2)+'</div>'+
                            '<div class="ppo-comp-detail">Rata-rata <span id="ppo-prev-akhlak-avg">'+akhlak.avg.toFixed(2)+'</span> × 3</div>'+
                        '</div>'+
                    '</div>'+

                    // Diklat
                    '<div class="ppo-comp-card">'+
                        '<div class="ppo-comp-hdr">'+
                            '<div class="ppo-comp-label">Diklat '+IC.lock+'</div>'+
                            '<div class="ppo-comp-weight">10% &middot; otomatis</div>'+
                        '</div>'+
                        '<div class="ppo-comp-body">'+
                            '<div class="ppo-comp-score" style="color:'+(diklat===10?'#15803D':'#B91C1C')+';">'+diklat+'</div>'+
                            '<div class="ppo-comp-detail">'+diklatChip+'</div>'+
                        '</div>'+
                    '</div>'+

                    // Total
                    '<div class="ppo-total-card" id="ppo-total-card" style="border-color:'+sts.color+'20;background:'+sts.bg+';">'+
                        '<div class="ppo-total-label" style="color:'+sts.color+';">Nilai Akhir</div>'+
                        '<div class="ppo-total-score" id="ppo-prev-total" style="color:'+sts.color+';">'+(rec?final.total.toFixed(1):'—')+'</div>'+
                        '<div class="ppo-total-status" id="ppo-prev-status" style="color:'+sts.color+';">'+sts.label+'</div>'+
                    '</div>'+

                    '<div class="ppo-formula">= (Tim × 0.60) + (Rata AKHLAK × 3) + Diklat</div>'+
                    (rec?'<div class="ppo-updated">Diperbarui '+new Date(rec.updatedAt).toLocaleString('id-ID')+' oleh '+esc(rec.updatedBy||'Admin')+'</div>':'')+
                '</div>'+

                // RIGHT COLUMN
                '<div class="ppo-mcol-right">'+
                    '<div class="ppo-mc-section-title">Penilaian BerAKHLAK</div>'+
                    (!isReadOnly?'<div class="ppo-preset-bar"><span>Isi semua nilai:</span>'+
                        [7,8,9,10].map(function(v){return '<button class="ppo-preset-btn" onclick="ppoApplyPreset('+v+')">'+v+'</button>';}).join('')+
                    '</div>':'')+
                    '<div class="ppo-akhl-list">'+akhlakHTML+'</div>'+
                '</div>'+

            '</div>'+

            '<div class="ppo-mfooter">'+
                (!isReadOnly&&rec?'<button class="ppo-mfbtn ppo-mfbtn-danger" onclick="ppoResetModal()">Reset</button>':'')+
                '<div style="flex:1"></div>'+
                '<button class="ppo-mfbtn ppo-mfbtn-ghost" onclick="ppoCloseModal()">'+(isReadOnly?'Tutup':'Batal')+'</button>'+
                (!isReadOnly?'<button class="ppo-mfbtn ppo-mfbtn-primary" onclick="ppoSaveModal()" id="ppo-save-btn">Simpan Penilaian</button>':'')+
            '</div>';

        document.getElementById('ppo-modal-overlay').classList.add('open');
        if(!isReadOnly) updatePreview();
    }

    function updatePreview() {
        if(!_activePid||_modalReadOnly) return;
        var personName='', unit='';
        GROUPS.some(function(g){
            var p=g.people.find(function(pp){return pid(g.id,pp.name)===_activePid;});
            if(p){unit=p.unit;personName=p.name;return true;}
        });
        var criteria={};
        document.querySelectorAll('#ppo-modal-box [data-key]').forEach(function(sel){criteria[sel.dataset.key]=parseFloat(sel.value)||7;});
        var diklatVal=getDiklatValue(personName), diklat=diklatVal!==null?diklatVal:0;
        var ts=getTeamScore(unit), akhlak=calcAkhlak(criteria);
        var final=calcFinal(ts,akhlak.avg,diklat), sts=statusOf(final.total);

        function setText(id,val){var el=document.getElementById(id);if(el)el.textContent=val;}
        setText('ppo-prev-akhlak-w',akhlak.weighted.toFixed(2));
        setText('ppo-prev-akhlak-avg',akhlak.avg.toFixed(2));
        setText('ppo-prev-total',final.total.toFixed(1));
        setText('ppo-prev-status',sts.label);

        var card=document.getElementById('ppo-total-card');
        if(card){
            card.style.borderColor=sts.color+'20';
            card.style.background=sts.bg;
            ['ppo-total-label','ppo-total-score','ppo-total-status'].forEach(function(cls){
                card.querySelectorAll('.'+cls).forEach(function(el){el.style.color=sts.color;});
            });
            var scoreEl=document.getElementById('ppo-prev-total');
            if(scoreEl) scoreEl.style.color=sts.color;
            var statusEl=document.getElementById('ppo-prev-status');
            if(statusEl) statusEl.style.color=sts.color;
            var labelEl=card.querySelector('.ppo-total-label');
            if(labelEl) labelEl.style.color=sts.color;
        }
    }

    function applyPreset(val) {
        document.querySelectorAll('#ppo-modal-box [data-key]').forEach(function(sel){sel.value=String(val);});
        updatePreview();
    }

    function fetchTeamScoreDirect(unit) {
        var btn=document.getElementById('ppo-btn-fetch-direct');
        var statusEl=document.getElementById('ppo-ts-fetch-status');
        if(btn){btn.disabled=true;btn.innerHTML='Mengambil...';}
        if(statusEl) statusEl.textContent='Mengambil dari server...';

        function restoreBtn(){if(btn){btn.disabled=false;btn.innerHTML=IC.refresh+' Perbarui';}}

        if(!window.PPO_GAS_CONFIG||!window.PPO_GAS_CONFIG.fetchAllTeamScores){
            gasJsonp({action:'getTeamScores',bulan:state.month,tahun:getCurrentYearString()})
                .then(function(teamRes){
                    if(teamRes&&teamRes.status==='success'&&teamRes.scores){
                        state.teamScores=teamRes.scores;
                        saveTeamCacheMonth(state.month,teamRes.scores);
                        var unitScore=teamRes.scores[unit];
                        if(unitScore){
                            var total=parseFloat(unitScore.total)||0;
                            _applyTeamScoreToModal(unit,total,unitScore);
                            if(statusEl){statusEl.textContent='Berhasil: total '+total.toFixed(1)+'/100';}
                            if(window.showToast) showToast('Skor tim diperbarui.','success');
                        } else {
                            if(statusEl) statusEl.textContent='Skor unit belum tersedia.';
                        }
                        render();
                    }
                }).catch(function(err){
                    if(statusEl) statusEl.textContent='Gagal: '+err.message;
                }).finally(restoreBtn);
            return;
        }

        window.PPO_GAS_CONFIG.fetchAllTeamScores(state.month)
            .then(function(allScores){
                state.teamScores=allScores;
                saveTeamCacheMonth(state.month,allScores);
                var unitScore=allScores[unit];
                if(unitScore){
                    var total=parseFloat(unitScore.total)||0;
                    _applyTeamScoreToModal(unit,total,unitScore);
                    if(statusEl) statusEl.textContent='Total: '+total.toFixed(1)+'/100';
                    if(window.showToast) showToast('Skor tim '+unit.split(' ')[0]+': '+total.toFixed(1),'success');
                    render();
                } else {
                    if(statusEl) statusEl.textContent='Skor unit belum tersedia.';
                }
            }).catch(function(err){
                if(statusEl) statusEl.textContent='Gagal: '+err.message;
            }).finally(restoreBtn);
    }

    function showTeamScoreInput(unit) {
        var panel=document.getElementById('ppo-ts-input-panel');
        if(!panel) return;
        panel.style.display=panel.style.display==='none'?'block':'none';
        if(panel.style.display!=='none') updateTeamScoreTotal();
    }

    function updateTeamScoreTotal() {
        var keys=['bbm','kendaraan','ruang','kearsipan','spj','monev'], total=0;
        keys.forEach(function(k){var el=document.getElementById('ppo-ts-'+k);if(el)total+=parseFloat(el.value)||0;});
        total=Math.min(100,Math.max(0,total));
        var el=document.getElementById('ppo-ts-manual-total');
        if(el) el.textContent=total.toFixed(1);
    }

    function applyTeamScore(unit) {
        var keys=['bbm','kendaraan','ruang','kearsipan','spj','monev'], components={}, total=0;
        keys.forEach(function(k){
            var el=document.getElementById('ppo-ts-'+k);
            if(!el) return;
            var v=parseFloat(el.value); if(isNaN(v)||v<0){v=0;el.value='0';}
            components[k]=+v.toFixed(2); total+=components[k];
        });
        total=+Math.min(100,total).toFixed(2);
        components.total=total;
        state.teamScores[unit]=components;
        saveTeamCacheMonth(state.month,state.teamScores);
        _applyTeamScoreToModal(unit,total,components);
        if(window.showToast) showToast('Skor tim: '+total.toFixed(1)+'/100','success');
        render();
    }

    function _applyTeamScoreToModal(unit, total, components) {
        var tsRaw=state.teamScores[unit]||null;
        var KOMP_DEF=[{label:'BBM',key:'bbm',maks:5},{label:'Kendaraan',key:'kendaraan',maks:10},{label:'Ruang Rapat',key:'ruang',maks:5},{label:'Kearsipan',key:'kearsipan',maks:5},{label:'SPJ',key:'spj',maks:35},{label:'Monev',key:'monev',maks:40}];
        var dispEl=document.getElementById('ppo-ts-display');
        if(dispEl) dispEl.textContent=total.toFixed(1);
        var wtEl=document.getElementById('ppo-ts-weighted');
        if(wtEl) wtEl.textContent=(total*0.60).toFixed(1);
        var detailEl=document.getElementById('ppo-ts-detail');
        if(detailEl&&components){
            detailEl.innerHTML='<div class="ppo-ts-breakdown">'+
                KOMP_DEF.map(function(c){
                    var v=parseFloat(components[c.key])||0;
                    var pct=Math.round(v/c.maks*100);
                    return '<div class="ppo-ts-br-row">'+
                        '<span class="ppo-ts-br-label">'+c.label+'</span>'+
                        '<div class="ppo-ts-br-bar"><div style="width:'+pct+'%"></div></div>'+
                        '<span class="ppo-ts-br-val">'+v.toFixed(1)+'<span class="ppo-ts-br-max">/'+c.maks+'</span></span>'+
                    '</div>';
                }).join('')+'</div>';
        }
        if(components){
            ['bbm','kendaraan','ruang','kearsipan','spj','monev'].forEach(function(k){
                var el=document.getElementById('ppo-ts-'+k);
                if(el&&components[k]!==undefined) el.value=parseFloat(components[k]).toFixed(1);
            });
            updateTeamScoreTotal();
        }
        var panel=document.getElementById('ppo-ts-input-panel');
        if(panel) panel.style.display='none';
        updatePreview();
    }

    function saveModal() {
        if(!_activePid||_modalReadOnly) return;
        var found=findPersonByPid(_activePid);
        if(!found) return;
        var criteria={};
        document.querySelectorAll('#ppo-modal-box [data-key]').forEach(function(sel){criteria[sel.dataset.key]=parseFloat(sel.value)||7;});
        var diklatVal=getDiklatValue(found.person.name), diklat=diklatVal!==null?diklatVal:0;
        var ts=getTeamScore(found.person.unit), akhlak=calcAkhlak(criteria), final=calcFinal(ts,akhlak.avg,diklat);
        var saveBtn=document.getElementById('ppo-save-btn');
        if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Menyimpan...';}
        var newRec={
            month:state.month, gid:found.group.id, evaluator:found.group.evaluator,
            name:found.person.name, unit:found.person.unit,
            criteria:criteria, diklat:diklat, teamScore:ts!==null?ts:0, summary:final,
            updatedAt:new Date().toISOString(),
            updatedBy:state.currentUser?(state.currentUser.name||'Admin'):'Admin'
        };
        setRec(_activePid,newRec);
        if(window.showToast) showToast('Penilaian tersimpan.','success');
        var syncPid=_activePid;
        closeModal(); render();
        saveToGAS(syncPid,newRec).then(function(res){
            if(!res) return;
            if(res.status==='success'){if(window.showToast)showToast('Tersinkronisasi ke server.','success');}
            else if(res.status!=='skipped'){if(window.showToast)showToast('Simpan lokal. Sinkronisasi gagal: '+(res.message||''),'error');}
        }).catch(function(err){if(window.showToast)showToast('Simpan lokal. Sinkronisasi gagal: '+err.message,'error');});
    }

    function resetModal() {
        if(!_activePid||_modalReadOnly) return;
        var pidToDelete=_activePid;
        function doDelete(){
            delRec(pidToDelete);
            if(window.showToast) showToast('Data penilaian direset.','success');
            closeModal(); render();
            deleteFromGAS(pidToDelete).catch(function(err){if(window.showToast)showToast('Lokal terhapus. Server gagal: '+err.message,'error');});
        }
        if(window.showConfirmModal){
            showConfirmModal({icon:'🗑️',title:'Reset Penilaian?',message:'Data bulan ini akan dihapus permanen.',confirmText:'Reset',confirmClass:'btn-danger'},doDelete);
        } else {
            if(!confirm('Reset data penilaian bulan ini?')) return;
            doDelete();
        }
    }

    function closeModal() {
        var overlay=document.getElementById('ppo-modal-overlay');
        var box=document.getElementById('ppo-modal-box');
        if(overlay) overlay.classList.remove('open');
        if(box) box.innerHTML='';
        _activePid=null; _modalReadOnly=false;
    }

    // ── EXPOSE GLOBAL ──
    window.ppoOpenModal            = openModal;
    window.ppoOpenModalView        = openModalView;
    window.ppoCloseModal           = closeModal;
    window.ppoUpdatePreview        = updatePreview;
    window.ppoApplyPreset          = applyPreset;
    window.ppoSaveModal            = saveModal;
    window.ppoResetModal           = resetModal;
    window.ppoLoadFromGAS          = loadFromGAS;
    window.ppoFetchTeamScore       = fetchTeamScoreDirect;
    window.ppoFetchTeamScoreDirect = fetchTeamScoreDirect;
    window.ppoShowTeamScoreInput   = showTeamScoreInput;
    window.ppoUpdateTeamScoreTotal = updateTeamScoreTotal;
    window.ppoApplyTeamScore       = applyTeamScore;
    window._ppoLoadTeamCacheMonth  = loadTeamCacheMonth;

    function switchTab(tab, btn) {
        document.querySelectorAll('#section-'+SECTION_ID+' .ppo-tab').forEach(function(b){b.classList.remove('active');});
        if(btn) btn.classList.add('active');
        ['daftar','rekap','ranking'].forEach(function(t){
            var el=document.getElementById('ppo-panel-'+t);
            if(el) el.style.display=(t===tab)?'block':'none';
        });
        if(tab==='rekap')   renderRekap();
        if(tab==='ranking') renderRanking();
    }
    window.ppoSwitchTab=switchTab;

    // ══════════════════════════════════════════════════════════
    // STYLES v5.0 — Professional & Clean
    // ══════════════════════════════════════════════════════════
    var STYLE_ID='ppo-styles-v5';
    function injectStyles() {
        if(document.getElementById(STYLE_ID)) return;
        var s=document.createElement('style');
        s.id=STYLE_ID;
        s.textContent=`
/* ─────────────────────────────────────────
   PPO v5.0 — Professional Government SaaS
───────────────────────────────────────── */
#section-penilaian-orang{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','DM Sans',sans-serif;}
#section-penilaian-orang *{box-sizing:border-box;}

/* SPIN */
@keyframes ppospn{to{transform:rotate(360deg);}}
.ppo-spin{animation:ppospn .7s linear infinite;display:inline-block;}

/* ── PAGE HEADER ── */
.ppo-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:28px;}
.ppo-header-left{display:flex;align-items:center;gap:14px;}
.ppo-header-icon{width:44px;height:44px;border-radius:12px;background:#1E293B;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ppo-title{font-size:21px;font-weight:700;color:#0F172A;letter-spacing:-.025em;margin:0;line-height:1.2;}
.ppo-subtitle{font-size:12.5px;color:#64748B;margin:3px 0 0;}
.ppo-header-right{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}

/* ── CONTROL BUTTONS ── */
.ppo-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .15s;font-family:inherit;white-space:nowrap;line-height:1.4;}
.ppo-btn-ghost{background:white;border-color:#E2E8F0;color:#374151;}
.ppo-btn-ghost:hover{background:#F8FAFC;border-color:#CBD5E1;}
.ppo-btn-primary{background:#1E293B;color:white;border-color:#1E293B;}
.ppo-btn-primary:hover{background:#0F172A;}
.ppo-btn-outline{background:white;border-color:#E2E8F0;color:#374151;}
.ppo-btn-outline:hover{background:#F8FAFC;}
.ppo-btn:disabled{opacity:.5;cursor:not-allowed;}
.ppo-sel{padding:7px 10px;border:1px solid #E2E8F0;border-radius:8px;font-size:12.5px;font-family:inherit;color:#374151;background:white;cursor:pointer;line-height:1.4;}
.ppo-sel:focus{outline:none;border-color:#94A3B8;}

/* ── STAT CARDS ── */
.ppo-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
/* stat-card override agar grid menyesuaikan layout ppo */
.ppo-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
.ppo-prog-track{height:3px;background:#F1F5F9;border-radius:2px;margin-top:6px;overflow:hidden;}
.ppo-prog-fill{height:100%;background:linear-gradient(90deg,#3B82F6,#10B981);border-radius:2px;transition:width .4s;}
.ppo-prog-track{height:3px;background:#F1F5F9;border-radius:2px;margin-top:8px;overflow:hidden;}
.ppo-prog-fill{height:100%;background:linear-gradient(90deg,#3B82F6,#10B981);border-radius:2px;transition:width .4s;}

/* ── STATUS BAR ── */
.ppo-status-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;background:#F8FAFC;border:1px solid #F1F5F9;font-size:12px;color:#6B7280;margin-bottom:14px;}
.ppo-status-dot{width:7px;height:7px;border-radius:50%;background:#6B7280;flex-shrink:0;}

/* ── TABS ── */
.ppo-tabs{display:flex;border-bottom:1.5px solid #E2E8F0;margin-bottom:18px;gap:0;}
.ppo-tab{padding:9px 18px;font-size:13px;font-weight:600;color:#6B7280;background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1.5px;transition:all .15s;font-family:inherit;}
.ppo-tab.active{color:#0F172A;border-bottom-color:#0F172A;}
.ppo-tab:hover:not(.active){color:#374151;}

/* ── FILTER BAR ── */
.ppo-filter-bar{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;}
.ppo-search-box{position:relative;flex:1;min-width:200px;}
.ppo-search-box svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9CA3AF;pointer-events:none;}
.ppo-search-input{width:100%;padding:7px 10px 7px 32px;border:1px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;color:#1E293B;background:white;}
.ppo-search-input:focus{outline:none;border-color:#94A3B8;}

/* ── TABLE CARD ── */
.ppo-tcard{background:white;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;}
.ppo-tcard-hdr{padding:14px 18px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.ppo-tcard-title{font-size:13.5px;font-weight:700;color:#1E293B;}
.ppo-tcard-count{font-size:12px;color:#94A3B8;}

/* ── TABLE ── */
.ppo-tbl-wrap{overflow-x:auto;}
#ppo-main-table{width:100%;border-collapse:collapse;font-size:13px;}
#ppo-main-table thead tr{background:#1E293B;}
#ppo-main-table th{padding:10px 12px;font-size:11px;font-weight:600;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.07em;text-align:left;white-space:nowrap;}
#ppo-main-table th.tc{text-align:center;}
#ppo-main-table td{padding:11px 12px;border-bottom:1px solid #F8FAFC;vertical-align:middle;}
#ppo-main-table tbody tr:hover td{background:#FAFAFA;}
#ppo-main-table tbody tr:last-child td{border-bottom:none;}

.ppo-td-no{color:#CBD5E1;font-size:12px;font-weight:500;width:36px;}
.ppo-td-unit{white-space:nowrap;}
.ppo-td-eval{font-size:12px;color:#94A3B8;}
.ppo-td-num{text-align:center;font-family:'SF Mono',ui-monospace,monospace;font-size:13px;font-weight:600;color:#475569;}
.ppo-td-dik{text-align:center;}
.ppo-td-total{text-align:center;font-family:'SF Mono',ui-monospace,monospace;}
.ppo-td-status{white-space:nowrap;}
.ppo-td-action{width:80px;}
.ppo-td-center{text-align:center;}
.ppo-total-val{font-size:15px;font-weight:700;color:#0F172A;}
.ppo-dim{color:#D1D5DB;}

/* ── AVATAR ── */
.ppo-avatar{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;letter-spacing:.01em;}
.ppo-avatar-sm{width:28px;height:28px;font-size:10px;}
.ppo-avatar-lg{width:40px;height:40px;font-size:13px;border-radius:10px;}
.ppo-person-cell{display:flex;align-items:center;gap:10px;}
.ppo-person-info{display:flex;flex-direction:column;}
.ppo-person-name{font-weight:600;font-size:13px;color:#1E293B;line-height:1.3;}
.ppo-person-unit{font-size:11.5px;color:#94A3B8;display:none;}
.ppo-unit-chip{font-size:11px;font-weight:600;padding:2px 8px;border-radius:5px;white-space:nowrap;}

/* ── STATUS / DIKLAT ── */
.ppo-status-badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11.5px;font-weight:600;white-space:nowrap;}
.ppo-dk-yes{display:inline-flex;align-items:center;font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:20px;background:#DCFCE7;color:#15803D;white-space:nowrap;}
.ppo-dk-no{display:inline-flex;align-items:center;font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:20px;background:#FEE2E2;color:#B91C1C;white-space:nowrap;}
.ppo-dk-load{font-size:12px;color:#D1D5DB;}

/* ── GROUP HEADER ROW ── */
.ppo-group-hdr td{background:#F8FAFC;padding:7px 12px;border-bottom:1px solid #E2E8F0;}
.ppo-group-hdr-label{font-size:11.5px;font-weight:700;color:#374151;}
.ppo-group-hdr-unit{font-size:11px;color:#94A3B8;margin-left:8px;}

/* ── ACTION BUTTONS ── */
.ppo-actions{display:flex;gap:4px;justify-content:center;}
.ppo-act-btn{width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border-radius:7px;border:1px solid transparent;cursor:pointer;transition:all .15s;background:none;}
.ppo-act-edit{background:#FFF7ED;color:#B45309;border-color:#FED7AA;}
.ppo-act-edit:hover{background:#FEF3C7;border-color:#FCD34D;}
.ppo-act-view{background:#EFF6FF;color:#2563EB;border-color:#BFDBFE;}
.ppo-act-view:hover{background:#DBEAFE;}

/* ── EMPTY ── */
.ppo-empty{text-align:center;padding:40px;color:#9CA3AF;font-size:13px;}

/* ── REKAP ── */
.ppo-rekap-card{background:white;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;}
.ppo-rekap-card table{width:100%;border-collapse:collapse;font-size:13px;}
.ppo-rekap-card thead{background:#1E293B;}
.ppo-rekap-card th{padding:10px 12px;font-size:11px;font-weight:600;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.07em;text-align:left;}

/* ── RANKING ── */
.ppo-ranking-card{background:white;border:1px solid #E2E8F0;border-radius:12px;padding:8px;}
.ppo-rank-row{display:flex;align-items:center;gap:10px;padding:10px 10px;border-radius:8px;transition:background .15s;}
.ppo-rank-row:hover{background:#F8FAFC;}
.ppo-rank-pos{width:28px;font-size:18px;text-align:center;flex-shrink:0;}
.ppo-rank-num{display:inline-block;width:22px;height:22px;border-radius:50%;background:#F1F5F9;color:#6B7280;font-size:11px;font-weight:700;line-height:22px;text-align:center;}
.ppo-rank-info{flex:1;min-width:0;}
.ppo-rank-name{font-weight:600;font-size:13px;color:#1E293B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ppo-rank-unit{font-size:11.5px;color:#94A3B8;}
.ppo-rank-score{font-size:20px;font-weight:700;color:#1E293B;font-family:'SF Mono',ui-monospace,monospace;min-width:50px;text-align:right;}

/* ══════════════════════════════════════
   MODAL v5.0
══════════════════════════════════════ */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(3px);z-index:9999;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;}
.modal-overlay.open{display:flex;}
#ppo-modal-box{background:white;border-radius:16px;width:100%;max-width:880px;margin:auto;border:1px solid #E2E8F0;overflow:hidden;}

.ppo-mhdr{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #F1F5F9;gap:12px;}
.ppo-mhdr-person{display:flex;align-items:center;gap:12px;}
.ppo-mhdr-name{font-size:15px;font-weight:700;color:#0F172A;display:flex;align-items:center;gap:8px;}
.ppo-mhdr-meta{font-size:12px;color:#6B7280;margin-top:2px;}
.ppo-mclose{width:32px;height:32px;border-radius:8px;border:1px solid #E2E8F0;background:#F8FAFC;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#6B7280;flex-shrink:0;}
.ppo-mclose:hover{background:#F1F5F9;color:#1E293B;}
.ppo-readonly-badge{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#FEF3C7;color:#B45309;}

.ppo-mbody{display:grid;grid-template-columns:.9fr 1.1fr;gap:0;max-height:70vh;overflow-y:auto;}
.ppo-mcol-left{padding:18px 20px;border-right:1px solid #F1F5F9;display:flex;flex-direction:column;gap:10px;}
.ppo-mcol-right{padding:18px 20px;}
.ppo-mc-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:4px;}

/* Component cards */
.ppo-comp-card{border:1px solid #F1F5F9;border-radius:10px;padding:12px 14px;background:#FAFAFA;}
.ppo-comp-hdr{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px;}
.ppo-comp-label{font-size:12.5px;font-weight:700;color:#1E293B;display:flex;align-items:center;gap:5px;}
.ppo-comp-weight{font-size:11px;color:#94A3B8;}
.ppo-comp-body{display:flex;align-items:baseline;gap:8px;}
.ppo-comp-score{font-size:28px;font-weight:700;color:#1E293B;font-family:'SF Mono',ui-monospace,monospace;line-height:1;}
.ppo-comp-detail{font-size:12px;color:#6B7280;}

/* TS breakdown bars */
.ppo-ts-breakdown{margin-top:8px;display:flex;flex-direction:column;gap:4px;}
.ppo-ts-br-row{display:flex;align-items:center;gap:7px;}
.ppo-ts-br-label{font-size:11.5px;color:#6B7280;width:60px;flex-shrink:0;}
.ppo-ts-br-bar{flex:1;height:4px;background:#E2E8F0;border-radius:2px;overflow:hidden;}
.ppo-ts-br-bar div{height:100%;background:#3B82F6;border-radius:2px;}
.ppo-ts-br-val{font-size:11.5px;font-weight:600;color:#374151;font-family:monospace;min-width:32px;text-align:right;}
.ppo-ts-br-max{color:#9CA3AF;font-weight:400;}

/* TS controls */
.ppo-ts-btns{display:flex;gap:6px;margin-top:10px;}
.ppo-ts-btn-refresh{flex:1;padding:7px 10px;border-radius:8px;border:1px solid #D1FAE5;background:#F0FDF4;color:#15803D;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;}
.ppo-ts-btn-refresh:disabled{opacity:.6;cursor:not-allowed;}
.ppo-ts-btn-manual{flex:1;padding:7px 10px;border-radius:8px;border:1px solid #E2E8F0;background:white;color:#374151;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
.ppo-ts-btn-manual:hover{background:#F8FAFC;}
.ppo-ts-status{font-size:11.5px;color:#6B7280;margin-top:5px;}
.ppo-ts-manual-panel{border:1px solid #E2E8F0;border-radius:10px;padding:12px;background:white;}
.ppo-ts-manual-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9CA3AF;margin-bottom:8px;}
.ppo-ts-input-row{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
.ppo-ts-input-row label{font-size:12px;color:#374151;width:90px;flex-shrink:0;}
.ppo-ts-input-row label span{color:#9CA3AF;}
.ppo-ts-input-row input{flex:1;padding:5px 8px;border:1px solid #E2E8F0;border-radius:7px;font-size:13px;font-weight:600;font-family:monospace;text-align:right;color:#1E293B;}
.ppo-ts-input-row input:focus{outline:none;border-color:#94A3B8;}
.ppo-ts-manual-footer{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #F1F5F9;padding-top:8px;margin-top:4px;font-size:12.5px;color:#374151;}
.ppo-ts-apply-btn{padding:5px 14px;border-radius:7px;border:none;background:#1E293B;color:white;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}

/* Total box */
.ppo-total-card{border-radius:12px;padding:16px;text-align:center;border:1.5px solid #F1F5F9;margin-top:2px;}
.ppo-total-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;}
.ppo-total-score{font-size:44px;font-weight:700;font-family:'SF Mono',ui-monospace,monospace;line-height:1;}
.ppo-total-status{font-size:12.5px;font-weight:600;margin-top:5px;}
.ppo-formula{font-size:11.5px;color:#94A3B8;background:#F8FAFC;border-radius:7px;padding:8px 10px;font-family:'SF Mono',ui-monospace,monospace;border:1px solid #F1F5F9;text-align:center;}
.ppo-updated{font-size:11px;color:#94A3B8;text-align:center;}

/* Diklat chips */
.ppo-chip-yes{font-size:11.5px;font-weight:600;color:#15803D;background:#DCFCE7;padding:2px 8px;border-radius:20px;display:inline-block;}
.ppo-chip-no{font-size:11.5px;font-weight:600;color:#B91C1C;background:#FEE2E2;padding:2px 8px;border-radius:20px;display:inline-block;}
.ppo-chip-loading{font-size:11.5px;color:#9CA3AF;}

/* AKHLAK list */
.ppo-preset-bar{display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap;}
.ppo-preset-bar span{font-size:11.5px;color:#6B7280;}
.ppo-preset-btn{padding:3px 12px;border-radius:20px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid #E2E8F0;background:white;font-family:inherit;color:#374151;}
.ppo-preset-btn:hover{border-color:#94A3B8;background:#F8FAFC;}
.ppo-akhl-list{display:flex;flex-direction:column;gap:6px;max-height:440px;overflow-y:auto;padding-right:2px;}
.ppo-akhl-row{border:1px solid #F1F5F9;border-radius:9px;padding:10px 12px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;background:white;}
.ppo-akhl-row:hover{border-color:#E2E8F0;background:#FAFAFA;}
.ppo-akhl-text{flex:1;min-width:0;}
.ppo-akhl-name{font-size:12.5px;font-weight:600;color:#1E293B;margin-bottom:2px;}
.ppo-akhl-desc{font-size:11.5px;color:#9CA3AF;line-height:1.5;}
.ppo-akhl-ctrl{flex-shrink:0;}
.ppo-akhl-sel{padding:6px 9px;border:1px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:12.5px;font-weight:600;min-width:140px;background:white;cursor:pointer;color:#1E293B;}
.ppo-akhl-sel:focus{border-color:#94A3B8;outline:none;}
.ppo-akhl-val{font-size:12.5px;font-weight:600;color:#1E293B;padding:6px 10px;background:#F8FAFC;border-radius:8px;min-width:140px;text-align:center;border:1px solid #F1F5F9;}

/* Modal footer */
.ppo-mfooter{display:flex;align-items:center;gap:8px;padding:14px 22px;border-top:1px solid #F1F5F9;flex-wrap:wrap;}
.ppo-mfbtn{display:inline-flex;align-items:center;gap:5px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit;transition:all .15s;}
.ppo-mfbtn-primary{background:#1E293B;color:white;border-color:#1E293B;}
.ppo-mfbtn-primary:hover{background:#0F172A;}
.ppo-mfbtn-primary:disabled{opacity:.5;cursor:not-allowed;}
.ppo-mfbtn-ghost{background:white;border-color:#E2E8F0;color:#374151;}
.ppo-mfbtn-ghost:hover{background:#F8FAFC;}
.ppo-mfbtn-danger{background:#FEF2F2;color:#B91C1C;border-color:#FECACA;}
.ppo-mfbtn-danger:hover{background:#FEE2E2;}

/* ══════════════════════════════════════
   MOBILE CARDS
══════════════════════════════════════ */
.ppo-mobile-list{display:none;}
.ppo-mcard{background:white;border:1px solid #E2E8F0;border-radius:12px;padding:14px;margin-bottom:10px;}
.ppo-mcard-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;}
.ppo-mcard-info{flex:1;min-width:0;}
.ppo-mcard-name{font-size:14px;font-weight:700;color:#1E293B;line-height:1.3;}
.ppo-mcard-unit{font-size:12px;color:#6B7280;margin-top:2px;}
.ppo-mcard-scores{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;padding:10px;background:#F8FAFC;border-radius:8px;}
.ppo-mscore{text-align:center;}
.ppo-mscore-label{font-size:10.5px;color:#94A3B8;font-weight:500;}
.ppo-mscore-val{font-size:14px;font-weight:700;color:#374151;font-family:monospace;}
.ppo-mscore-total .ppo-mscore-val{color:#1E293B;}
.ppo-mscore-big{font-size:18px !important;}
.ppo-mcard-actions{display:flex;gap:7px;}
.ppo-mbtn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit;}
.ppo-mbtn-edit{background:#FFF7ED;color:#B45309;border-color:#FED7AA;}
.ppo-mbtn-view{background:#EFF6FF;color:#2563EB;border-color:#BFDBFE;}

/* ══════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════ */
@media(max-width:900px){
    .ppo-mbody{grid-template-columns:1fr;max-height:none;}
    .ppo-mcol-left{border-right:none;border-bottom:1px solid #F1F5F9;}
}
@media(max-width:768px){
    .ppo-stat-grid{grid-template-columns:repeat(2,1fr);}
    .ppo-tbl-wrap{display:none;}
    .ppo-mobile-list{display:block;}
    .ppo-header{flex-direction:column;gap:12px;}
    .ppo-header-right{width:100%;}
    .ppo-header-right .ppo-sel{flex:1;}
    .ppo-filter-bar{flex-direction:column;}
    .ppo-search-box{width:100%;}
    .ppo-sel{width:100%;}
    .ppo-mcard-scores{grid-template-columns:repeat(2,1fr);}
    .ppo-mfooter{flex-direction:column;}
    .ppo-mfbtn{width:100%;justify-content:center;}
    .ppo-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .ppo-tab{white-space:nowrap;font-size:12.5px;padding:8px 14px;}
}
@media(max-width:480px){
    .ppo-stat-grid{grid-template-columns:1fr 1fr;}
    .ppo-scard-val{font-size:22px;}
    .ppo-modal-overlay{padding:10px;}
}
`;
        document.head.appendChild(s);
    }

    // ══════════════════════════════════════════════════════════
    // BUILD SHELL v5.0
    // ══════════════════════════════════════════════════════════
    function buildShell() {
        var section=document.getElementById('section-'+SECTION_ID);
        if(!section) return;
        var u=state.currentUser, admin=isAdmin(), prog=isProgram();
        var showAllGroups=admin||prog;

        var roleLabel=u&&u._role?(window.AUTH&&AUTH.ROLE_LABELS?(AUTH.ROLE_LABELS[u._role]||u._role):u._role):'';
        var heroSub=showAllGroups
            ?'Tampilan seluruh pegawai lintas unit'
            :'Menilai sebagai <strong>'+esc(roleLabel)+'</strong>'+(u&&u.name?' &middot; '+esc(u.name.split(',')[0]):'');

        var penilaiFilter=showAllGroups
            ?'<select id="ppo-group-filter" class="ppo-sel" onchange="(function(){window._ppoState.groupFilter=document.getElementById(\'ppo-group-filter\').value;window._ppoRender();})()">'+
               '<option value="">Semua penilai</option>'+
               GROUPS.map(function(g){return '<option value="'+g.id+'">'+esc(g.evaluator.split(',')[0])+'</option>';}).join('')+'</select>'
            :'';

        var adminTabs=showAllGroups
            ?'<button class="ppo-tab" onclick="ppoSwitchTab(\'rekap\',this)">Rekap Divisi</button>'+
               '<button class="ppo-tab" onclick="ppoSwitchTab(\'ranking\',this)">Ranking</button>'
            :'';

        var iconUserWhite='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

        section.innerHTML=[
        '<div class="container">',

        // Page Header
        '<div class="ppo-header">',
            '<div class="ppo-header-left">',
                '<div class="ppo-header-icon">'+iconUserWhite+'</div>',
                '<div>',
                    '<h1 class="ppo-title">Penilaian Per Orang</h1>',
                    '<p class="ppo-subtitle">'+heroSub+'</p>',
                '</div>',
            '</div>',
            '<div class="ppo-header-right">',
                '<select id="ppo-month-sel" class="ppo-sel" onchange="(function(){var v=document.getElementById(\'ppo-month-sel\').value;if(!v)return;window._ppoState.month=v;window._ppoState.teamScores=window._ppoLoadTeamCacheMonth(v);window._ppoRender();if(window.ppoLoadFromGAS)window.ppoLoadFromGAS();})()">'+
                    MONTHS.map(function(m){return '<option value="'+m+'">'+monthLabel(m)+'</option>';}).join('')+'</select>',
                '<button class="ppo-btn ppo-btn-ghost" onclick="(function(){window._ppoState.diklatLoaded=false;window._ppoState.diklatScores={};try{localStorage.removeItem(\''+DIKLAT_CACHE_KEY+'\');}catch(e){}return window.ppoLoadFromGAS();})()" title="Refresh data diklat">'+IC.refresh+' Diklat</button>',
                '<button id="ppo-btn-refresh" class="ppo-btn ppo-btn-primary" onclick="window.ppoLoadFromGAS()">'+IC.refresh+' Refresh</button>',
            '</div>',
        '</div>',

        // Stats
        '<div class="ppo-stat-grid" id="ppo-stat-grid"></div>',

        // Tabs
        '<div class="ppo-tabs">',
            '<button class="ppo-tab active" onclick="ppoSwitchTab(\'daftar\',this)">Daftar Pegawai</button>',
            adminTabs,
        '</div>',

        // Panel Daftar
        '<div id="ppo-panel-daftar">',
            '<div class="ppo-status-bar">',
                '<div class="ppo-status-dot" id="ppo-status-dot"></div>',
                '<span id="ppo-status-msg">Skor tim &amp; diklat dimuat otomatis saat halaman dibuka</span>',
            '</div>',
            '<div class="ppo-filter-bar">',
                '<div class="ppo-search-box">',
                    IC.search,
                    '<input type="text" id="ppo-search" class="ppo-search-input" placeholder="Cari nama atau unit..." oninput="(function(){window._ppoState.search=document.getElementById(\'ppo-search\').value;window._ppoRender();})()">',
                '</div>',
                penilaiFilter,
                '<select id="ppo-status-filter" class="ppo-sel" onchange="(function(){window._ppoState.statusFilter=document.getElementById(\'ppo-status-filter\').value;window._ppoRender();})()">',
                    '<option value="">Semua status</option>',
                    '<option value="done">Sudah dinilai</option>',
                    '<option value="draft">Belum dinilai</option>',
                '</select>',
            '</div>',
            '<div class="ppo-tcard">',
                '<div class="ppo-tcard-hdr">',
                    '<div class="ppo-tcard-title">Daftar Pegawai</div>',
                    '<div class="ppo-tcard-count" id="ppo-table-count"></div>',
                '</div>',
                // Desktop table
                '<div class="ppo-tbl-wrap">',
                    '<table id="ppo-main-table"><thead><tr>',
                        '<th>#</th>',
                        '<th>Nama Pegawai</th>',
                        '<th>Unit</th>',
                        '<th id="ppo-col-evaluator">Penilai</th>',
                        '<th class="tc">Tim</th>',
                        '<th class="tc">AKHLAK</th>',
                        '<th class="tc">Diklat</th>',
                        '<th class="tc">Total</th>',
                        '<th class="tc">Status</th>',
                        '<th></th>',
                    '</tr></thead><tbody id="ppo-tbody"></tbody></table>',
                '</div>',
                // Mobile card list
                '<div class="ppo-mobile-list" id="ppo-mobile-list"></div>',
            '</div>',
        '</div>',

        // Panel Rekap
        '<div id="ppo-panel-rekap" style="display:none;">',
            '<div class="ppo-rekap-card">',
                '<div style="overflow-x:auto;">',
                    '<table><thead><tr>',
                        '<th>Divisi / Unit</th>',
                        '<th style="text-align:center;">Pegawai</th>',
                        '<th style="text-align:center;">Dinilai</th>',
                        '<th>Progress</th>',
                        '<th style="text-align:center;">Rata Nilai</th>',
                        '<th style="text-align:center;">Rata AKHLAK</th>',
                        '<th style="text-align:center;">Rata Diklat</th>',
                    '</tr></thead>',
                    '<tbody id="ppo-rekap-tbody"></tbody>',
                    '</table>',
                '</div>',
            '</div>',
        '</div>',

        // Panel Ranking
        '<div id="ppo-panel-ranking" style="display:none;">',
            '<div class="ppo-ranking-card"><div id="ppo-ranking-list"></div></div>',
        '</div>',

        '</div>',

        // Modal
        '<div class="modal-overlay" id="ppo-modal-overlay" onclick="if(event.target===this)ppoCloseModal()">',
            '<div id="ppo-modal-box"></div>',
        '</div>'
        ].join('');

        var mSel=document.getElementById('ppo-month-sel');
        if(mSel) mSel.value=state.month;
    }

    // ══════════════════════════════════════════════════════════
    // SECTION INIT
    // ══════════════════════════════════════════════════════════
    window.sectionInits=window.sectionInits||{};
    window.sectionInits[SECTION_ID]=function(){
        state.currentUser=getUser();
        if(state.currentUser&&!state.currentUser.gid){
            var role=state.currentUser._role;
            if(ROLE_TO_GID[role]){
                state.currentUser.gid=ROLE_TO_GID[role];
            } else {
                var derivedGid=deriveGidFromUser(state.currentUser);
                if(derivedGid) state.currentUser.gid=derivedGid;
            }
        }
        loadRecords();
        injectStyles();
        buildShell();
        window._ppoState      = state;
        window._ppoRender     = render;
        window._ppoMonthLabel = monthLabel;

        state.teamScores=loadTeamCacheMonth(state.month);
        var cachedDiklat=loadDiklatCache();
        if(cachedDiklat){
            state.diklatScores=cachedDiklat;
            state.diklatLoaded=true;
            _updateAutoLoadStatus('Dari cache lokal — menyinkronisasi...','warning');
        }

        render();
        setTimeout(function(){loadFromGAS();},200);
    };

})();