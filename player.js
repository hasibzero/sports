class M3UPlayer {
    constructor() {
        this.fixedChannels = [
            { title: 'TSN Live', url: 'https://ataide0.sandhost.dpdns.org/tsn.m3u8', desc: 'TSN Live Sports Streaming Channel. High quality digital broadcast.', category: 'Sports' },
            { title: 'Channel 23 Live', url: 'https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8', desc: 'Channel 23 General Entertainment and Live Broadcast.', category: 'Entertainment' },
            { title: 'FOX Live', url: 'https://daffodil.sandhost.dpdns.org/fox.m3u8', desc: 'FOX Live news and show broadcasting source.', category: 'News' },
            { title: 'FIFA: Holanda x Japão', url: 'https://www.youtube.com/embed/byP1peOCkzI', desc: 'Copa do Mundo FIFA™ 2026: Live Match broadcast. NOTE: Brazil VPN is required to watch this stream.', category: 'FIFA World Cup', isEmbed: true, vpnRequired: 'Brazil' }
        ];

        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isMuted = false;
        this.savedVolume = 0.7;
        this.isTheatreMode = false;
        this.autoPlay = true;

        this.hls = null;

        this.initElements();
        this.attachEventListeners();
        this.loadSettings();
        this.loadFixedChannels();
    }

    initElements() {
        // Core layout
        this.appContainer = document.getElementById('appContainer');
        this.playerWrapper = document.getElementById('playerWrapper');
        this.playerDisplay = document.getElementById('playerDisplay');
        this.playerSection = document.getElementById('playerSection');
        this.emptyState = document.getElementById('emptyState');
        this.playlistColumn = document.getElementById('playlistColumn');

        // Players
        this.videoPlayer = document.getElementById('videoPlayer');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.iframePlayer = document.getElementById('iframePlayer');

        // Play/Pause/Nav Controls
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.muteBtn = document.getElementById('muteBtn');
        this.qualitySelect = document.getElementById('qualitySelect');

        // New Mode Controls
        this.theatreBtn = document.getElementById('theatreBtn');
        this.theatreIcon = document.getElementById('theatreIcon');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.fullscreenIcon = document.getElementById('fullscreenIcon');
        
        // Playlist & Search
        this.playlistEl = document.getElementById('playlist');
        this.searchInput = document.getElementById('searchInput');
        this.resetPlaylistBtn = document.getElementById('resetPlaylistBtn');
        this.channelCountBadge = document.getElementById('channelCountBadge');

        // Overlays & Badges
        this.nowPlayingTitleOverlay = document.getElementById('nowPlayingTitleOverlay');
        this.centerPlayOverlay = document.getElementById('centerPlayOverlay');
        this.centerPlayBtn = document.getElementById('centerPlayBtn');
        this.spinnerOverlay = document.getElementById('spinnerOverlay');
        this.errorOverlay = document.getElementById('errorOverlay');
        this.retryStreamBtn = document.getElementById('retryStreamBtn');
        this.emptyResetBtn = document.getElementById('emptyResetBtn');
        this.vpnBadge = document.getElementById('vpnBadge');

        // Now Playing Audio Box
        this.nowPlaying = document.getElementById('nowPlaying');
        this.nowPlayingTitle = document.getElementById('nowPlayingTitle');
        this.nowPlayingArtist = document.getElementById('nowPlayingArtist');

        // Stream Info Labels
        this.streamNameDisplay = document.getElementById('streamNameDisplay');
        this.streamDescDisplay = document.getElementById('streamDescDisplay');

        // Modal Elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.themeToggleBtn = document.getElementById('themeToggleBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.autoPlayToggle = document.getElementById('autoPlayToggle');
        this.themeSelect = document.getElementById('themeSelect');
        this.modalBackdrop = document.getElementById('modalBackdrop');
    }

    attachEventListeners() {
        // Player buttons
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.centerPlayBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.qualitySelect.addEventListener('change', (e) => this.setQuality(e.target.value));

        // Screen layout modes
        this.theatreBtn.addEventListener('click', () => this.toggleTheatreMode());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Fullscreen browser changes listener
        const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
        fsEvents.forEach(evt => document.addEventListener(evt, () => this.onFullscreenChange()));

        // Playlist filtering & resets
        this.searchInput.addEventListener('input', (e) => this.filterPlaylist(e.target.value));
        this.resetPlaylistBtn.addEventListener('click', () => this.resetPlaylist());
        if (this.emptyResetBtn) this.emptyResetBtn.addEventListener('click', () => this.resetPlaylist());
        if (this.retryStreamBtn) this.retryStreamBtn.addEventListener('click', () => this.loadTrack(this.currentIndex));

        // Settings / Theme
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        if (this.modalBackdrop) this.modalBackdrop.addEventListener('click', () => this.closeSettingsModal());
        this.autoPlayToggle.addEventListener('change', (e) => {
            this.autoPlay = e.target.checked;
            this.saveSettings();
        });
        this.themeSelect.addEventListener('change', (e) => this.setTheme(e.target.value));

        // Hotkeys
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Media elements load and state events
        [this.videoPlayer, this.audioPlayer].forEach((player) => {
            player.addEventListener('waiting', () => this.showSpinner(true));
            player.addEventListener('playing', () => {
                this.showSpinner(false);
                this.showError(false);
            });
            player.addEventListener('loadstart', () => this.showSpinner(true));
            player.addEventListener('loadeddata', () => this.showSpinner(false));
            player.addEventListener('error', () => this.handleStreamError());
        });
    }

    getCurrentPlayer() {
        return this.videoPlayer;
    }

    loadFixedChannels() {
        this.playlist = this.fixedChannels.map((channel) => ({ ...channel }));
        if (this.channelCountBadge) {
            this.channelCountBadge.textContent = `${this.playlist.length} Channels`;
        }
        this.updateUI();
    }

    updateUI() {
        if (this.playlist.length === 0) {
            if (this.playerSection) this.playerSection.style.display = 'none';
            if (this.emptyState) this.emptyState.style.display = 'flex';
            return;
        }

        if (this.playerSection) this.playerSection.style.display = 'flex';
        if (this.emptyState) this.emptyState.style.display = 'none';
        
        this.renderPlaylist();
        this.currentIndex = 0;
        this.loadTrack(0);
    }

    renderPlaylist() {
        this.playlistEl.innerHTML = '';
        this.playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = `playlist-item ${index === this.currentIndex ? 'active' : ''}`;
            const vpnLabel = track.vpnRequired ? `<span class="playlist-item-vpn" title="${track.vpnRequired} VPN Required"><i class="fas fa-shield-halved"></i> ${track.vpnRequired} VPN</span>` : '';
            const cleanTitle = this.stripStreamLink(track.title || '');
            item.innerHTML = `
                <span class="playlist-item-index">${index + 1}</span>
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${cleanTitle} ${vpnLabel}</div>
                    <div class="playlist-item-duration">${track.category || 'Live Stream'}</div>
                </div>
                <i class="fas fa-play playlist-item-play"></i>
            `;
            item.addEventListener('click', () => {
                this.isPlaying = true; // Playing starts immediately when a channel is clicked
                this.loadTrack(index);
            });
            this.playlistEl.appendChild(item);
        });
    }

    stripStreamLink(text) {
        return String(text)
            .replace(/https?:\/\/\S+/gi, '')
            .replace(/www\.\S+/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentIndex = index;
        const track = this.playlist[index];
        const isHlsStream = /\.m3u8($|\?)/i.test(track.url);

        this.teardownHls();
        this.videoPlayer.pause();
        this.showError(false);
        this.showSpinner(true);

        // Reset iframe source to prevent background playing
        if (this.iframePlayer) {
            this.iframePlayer.src = '';
            this.iframePlayer.style.display = 'none';
        }

        // Show/hide VPN badge
        if (this.vpnBadge) {
            if (track.vpnRequired) {
                this.vpnBadge.style.display = 'inline-flex';
                this.vpnBadge.innerHTML = `<i class="fas fa-shield-halved"></i> ${track.vpnRequired} VPN Required`;
            } else {
                this.vpnBadge.style.display = 'none';
            }
        }

        // Update info displays
        const cleanTitle = this.stripStreamLink(track.title || '');
        const cleanDesc = this.stripStreamLink(track.desc || '');
        if (this.streamNameDisplay) this.streamNameDisplay.textContent = cleanTitle;
        if (this.streamDescDisplay) this.streamDescDisplay.textContent = cleanDesc || 'No description available for this channel.';
        if (this.nowPlayingTitleOverlay) this.nowPlayingTitleOverlay.textContent = cleanTitle;
        
        this.renderPlaylist();

        if (track.isEmbed) {
            this.videoPlayer.style.display = 'none';
            if (this.audioPlayer) this.audioPlayer.style.display = 'none';
            if (this.iframePlayer) {
                this.iframePlayer.style.display = 'block';
                this.iframePlayer.src = track.url;
            }
            this.showSpinner(false);
            this.updatePlayStateUI(true);
        } else {
            this.videoPlayer.style.display = 'block';
            if (isHlsStream) {
                this.setupHls(track.url);
            } else {
                this.videoPlayer.src = track.url;
                this.setQualityControlState(false, ['Auto Quality']);
            }
        }
    }

    setupHls(url) {
        if (window.Hls && Hls.isSupported()) {
            this.hls = new Hls({
                capLevelToPlayerSize: true,
                startLevel: -1,
                maxBufferLength: 15,
                enableWorker: true
            });

            this.hls.loadSource(url);
            this.hls.attachMedia(this.videoPlayer);

            this.hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                const labels = ['Auto Quality', ...this.getQualityLabels(data.levels || [])];
                this.setQualityControlState(true, labels);
                if (this.isPlaying) {
                    this.safePlay(this.videoPlayer);
                } else {
                    this.updatePlayStateUI(false);
                }
            });

            this.hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('Fatal network error, trying to recover...', data);
                            this.hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('Fatal media error, trying to recover...', data);
                            this.hls.recoverMediaError();
                            break;
                        default:
                            console.error('Fatal unrecoverable HLS error:', data);
                            this.handleStreamError();
                            break;
                    }
                }
            });

            return;
        }

        // Native Safari fallback
        if (this.videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            this.videoPlayer.src = url;
            this.setQualityControlState(false, ['Auto Quality']);
            if (this.isPlaying) {
                this.safePlay(this.videoPlayer);
            } else {
                this.updatePlayStateUI(false);
            }
        } else {
            this.handleStreamError();
        }
    }

    teardownHls() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }

    getQualityLabels(levels) {
        return levels.map((level, index) => {
            if (level.height) return `${level.height}p`;
            if (level.bitrate) return `${Math.round(level.bitrate / 1000)} kbps`;
            return `Quality Level ${index + 1}`;
        });
    }

    setQualityControlState(enabled, options) {
        this.qualitySelect.innerHTML = '';
        const qualityOptions = options.map((label, index) => ({
            value: index === 0 ? 'auto' : String(index - 1),
            label
        }));

        qualityOptions.forEach((option) => {
            const item = document.createElement('option');
            item.value = option.value;
            item.textContent = option.label;
            this.qualitySelect.appendChild(item);
        });
        this.qualitySelect.value = 'auto';
        this.qualitySelect.disabled = !enabled;
    }

    setQuality(value) {
        if (!this.hls) return;
        this.hls.currentLevel = value === 'auto' ? -1 : Number(value);
    }

    togglePlay() {
        const player = this.getCurrentPlayer();
        if (this.isPlaying) {
            player.pause();
            this.isPlaying = false;
            this.updatePlayStateUI(false);
        } else {
            this.isPlaying = true;
            this.safePlay(player);
        }
    }

    safePlay(player) {
        this.showError(false);
        const playPromise = player.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.then(() => {
                this.updatePlayStateUI(true);
            }).catch((error) => {
                console.error('Playback failed:', error);
                this.isPlaying = false;
                this.updatePlayStateUI(false);
                this.showSpinner(false);
            });
        }
    }

    updatePlayStateUI(playing) {
        if (playing) {
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.playBtn.title = 'Pause';
            if (this.centerPlayOverlay) {
                this.centerPlayOverlay.classList.remove('paused');
                this.centerPlayOverlay.querySelector('i').className = 'fas fa-pause';
            }
        } else {
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.playBtn.title = 'Play';
            if (this.centerPlayOverlay) {
                this.centerPlayOverlay.classList.add('paused');
                this.centerPlayOverlay.querySelector('i').className = 'fas fa-play';
            }
        }
    }

    nextTrack() {
        if (this.playlist.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.isPlaying = true;
        this.loadTrack(this.currentIndex);
    }

    previousTrack() {
        if (this.playlist.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.isPlaying = true;
        this.loadTrack(this.currentIndex);
    }

    setVolume(value) {
        const player = this.getCurrentPlayer();
        player.volume = value;
        this.volumeSlider.value = Math.round(value * 100);
        
        // Update mute icon
        if (value === 0) {
            this.muteBtn.innerHTML = '<i class="fas fa-volume-xmark"></i>';
            this.isMuted = true;
        } else if (value < 0.4) {
            this.muteBtn.innerHTML = '<i class="fas fa-volume-low"></i>';
            this.isMuted = false;
        } else {
            this.muteBtn.innerHTML = '<i class="fas fa-volume-high"></i>';
            this.isMuted = false;
        }
        
        if (value > 0) {
            this.savedVolume = value;
        }
    }

    toggleMute() {
        if (this.isMuted) {
            this.setVolume(this.savedVolume);
        } else {
            this.setVolume(0);
        }
    }

    toggleTheatreMode() {
        this.isTheatreMode = !this.isTheatreMode;
        if (this.isTheatreMode) {
            this.appContainer.classList.add('theatre-layout');
            this.theatreIcon.className = 'fas fa-tv';
            this.theatreBtn.title = 'Normal Mode (T)';
        } else {
            this.appContainer.classList.remove('theatre-layout');
            this.theatreIcon.className = 'fas fa-clapperboard';
            this.theatreBtn.title = 'Theatre Mode (T)';
        }
        localStorage.setItem('theatreMode', this.isTheatreMode);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement &&
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement) {
            // Enter Fullscreen
            const fullscreenTarget = this.playerDisplay || this.playerWrapper;
            const requestFS = fullscreenTarget.requestFullscreen || 
                              fullscreenTarget.msRequestFullscreen || 
                              fullscreenTarget.mozRequestFullScreen || 
                              fullscreenTarget.webkitRequestFullscreen;
            if (requestFS) {
                requestFS.call(fullscreenTarget);
            }
        } else {
            // Exit Fullscreen
            const exitFS = document.exitFullscreen || 
                           document.msExitFullscreen || 
                           document.mozCancelFullScreen || 
                           document.webkitExitFullscreen;
            if (exitFS) {
                exitFS.call(document);
            }
        }
    }

    onFullscreenChange() {
        const isFS = !!(document.fullscreenElement || 
                        document.mozFullScreenElement || 
                        document.webkitFullscreenElement || 
                        document.msFullscreenElement);
        
        this.isFullscreen = isFS;
        if (isFS) {
            this.fullscreenIcon.className = 'fas fa-compress';
            this.fullscreenBtn.title = 'Exit Fullscreen (F)';
        } else {
            this.fullscreenIcon.className = 'fas fa-expand';
            this.fullscreenBtn.title = 'Fullscreen (F)';
        }
    }

    showSpinner(visible) {
        if (this.spinnerOverlay) {
            this.spinnerOverlay.style.display = visible ? 'flex' : 'none';
        }
    }

    showError(visible) {
        if (this.errorOverlay) {
            this.errorOverlay.style.display = visible ? 'flex' : 'none';
        }
    }

    handleStreamError() {
        this.showSpinner(false);
        this.showError(true);
        if (this.autoPlay) {
            setTimeout(() => {
                // Only autoplay next if error is still active and player hasn't moved
                if (this.errorOverlay && this.errorOverlay.style.display !== 'none') {
                    console.log('Stream error, autoplaying next channel...');
                    this.nextTrack();
                }
            }, 5000);
        }
    }

    filterPlaylist(query) {
        const items = this.playlistEl.querySelectorAll('.playlist-item');
        let visibleCount = 0;
        items.forEach((item) => {
            const title = item.querySelector('.playlist-item-title').textContent;
            const matches = title.toLowerCase().includes(query.toLowerCase());
            item.style.display = matches ? 'flex' : 'none';
            if (matches) visibleCount++;
        });

        if (this.channelCountBadge) {
            this.channelCountBadge.textContent = `${visibleCount} Channels`;
        }
    }

    resetPlaylist() {
        this.searchInput.value = '';
        this.isPlaying = false;
        this.updatePlayStateUI(false);
        this.loadFixedChannels();
    }

    handleKeyboard(e) {
        if (e.target === this.searchInput) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowRight':
                this.nextTrack();
                break;
            case 'ArrowLeft':
                this.previousTrack();
                break;
            case 'KeyF':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'KeyT':
                e.preventDefault();
                this.toggleTheatreMode();
                break;
            case 'KeyM':
                e.preventDefault();
                this.toggleMute();
                break;
            default:
                break;
        }
    }

    openSettings() {
        this.settingsModal.style.display = 'flex';
    }

    closeSettingsModal() {
        this.settingsModal.style.display = 'none';
    }

    toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        const themeIcon = this.themeToggleBtn.querySelector('i');
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            themeIcon.className = 'fas fa-sun';
            this.themeSelect.value = 'light';
        } else {
            document.body.classList.remove('light-theme');
            themeIcon.className = 'fas fa-moon';
            this.themeSelect.value = 'dark';
        }
        localStorage.setItem('theme', theme);
    }

    saveSettings() {
        localStorage.setItem('autoPlay', this.autoPlay);
    }

    loadSettings() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const savedAutoPlay = localStorage.getItem('autoPlay') !== 'false';
        const savedTheatre = localStorage.getItem('theatreMode') === 'true';

        this.themeSelect.value = savedTheme;
        this.autoPlayToggle.checked = savedAutoPlay;
        this.autoPlay = savedAutoPlay;
        this.setTheme(savedTheme);
        this.setVolume(this.savedVolume);

        if (savedTheatre) {
            this.toggleTheatreMode();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new M3UPlayer();
});
