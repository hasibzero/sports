class M3UPlayer {
    constructor() {
        this.fixedChannels = [
            { title: 'TSN Live', url: 'https://ataide0.sandhost.dpdns.org/tsn.m3u8', duration: 0 },
            { title: 'Stream 23', url: 'https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8', duration: 0 },
            { title: 'FOX Live', url: 'https://daffodil.sandhost.dpdns.org/fox.m3u8', duration: 0 }
        ];

        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 0;
        this.autoPlay = true;
        this.isVideo = true;

        this.hls = null;

        this.initElements();
        this.attachEventListeners();
        this.loadSettings();
        this.loadFixedChannels();
    }

    initElements() {
        this.videoPlayer = document.getElementById('videoPlayer');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playerSection = document.getElementById('playerSection');
        this.emptyState = document.getElementById('emptyState');

        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.qualitySelect = document.getElementById('qualitySelect');

        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.progressHandle = document.getElementById('progressHandle');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');

        this.playlistEl = document.getElementById('playlist');
        this.searchInput = document.getElementById('searchInput');
        this.clearPlaylistBtn = document.getElementById('clearPlaylistBtn');

        this.nowPlayingTitle = document.getElementById('nowPlayingTitle');
        this.nowPlayingArtist = document.getElementById('nowPlayingArtist');
        this.nowPlayingDuration = document.getElementById('nowPlayingDuration');
        this.nowPlaying = document.getElementById('nowPlaying');

        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.autoPlayToggle = document.getElementById('autoPlayToggle');
        this.themeSelect = document.getElementById('themeSelect');
    }

    attachEventListeners() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.qualitySelect.addEventListener('change', (e) => this.setQuality(e.target.value));

        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.progressHandle.addEventListener('mousedown', (e) => this.startDrag(e));

        this.searchInput.addEventListener('input', (e) => this.filterPlaylist(e.target.value));
        this.clearPlaylistBtn.addEventListener('click', () => this.resetPlaylist());

        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.autoPlayToggle.addEventListener('change', (e) => {
            this.autoPlay = e.target.checked;
            this.saveSettings();
        });
        this.themeSelect.addEventListener('change', (e) => this.setTheme(e.target.value));

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        [this.videoPlayer, this.audioPlayer].forEach((player) => {
            player.addEventListener('timeupdate', () => this.updateProgress());
            player.addEventListener('ended', () => this.onTrackEnded());
            player.addEventListener('loadedmetadata', () => this.updateDuration());
        });
    }

    getCurrentPlayer() {
        return this.isVideo ? this.videoPlayer : this.audioPlayer;
    }

    loadFixedChannels() {
        this.playlist = this.fixedChannels.map((channel) => ({ ...channel }));
        this.updateUI();
    }

    updateUI() {
        if (this.playlist.length === 0) {
            this.playerSection.style.display = 'none';
            this.emptyState.style.display = 'flex';
            return;
        }

        this.playerSection.style.display = 'grid';
        this.emptyState.style.display = 'none';
        this.renderPlaylist();
        this.currentIndex = 0;
        this.loadTrack(0);
    }

    renderPlaylist() {
        this.playlistEl.innerHTML = '';
        this.playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = `playlist-item ${index === this.currentIndex ? 'active' : ''}`;
            item.innerHTML = `
                <span class="playlist-item-index">${index + 1}</span>
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${track.title}</div>
                    <div class="playlist-item-duration">${this.formatTime(track.duration || 0)}</div>
                </div>
                <i class="fas fa-play playlist-item-play"></i>
            `;
            item.addEventListener('click', () => this.loadTrack(index));
            this.playlistEl.appendChild(item);
        });
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentIndex = index;
        const track = this.playlist[index];
        const isHlsStream = /\.m3u8($|\?)/i.test(track.url);

        this.teardownHls();
        this.videoPlayer.pause();
        this.audioPlayer.pause();

        this.isVideo = true;
        this.videoPlayer.style.display = 'block';
        this.audioPlayer.style.display = 'none';

        if (isHlsStream) {
            this.setupHls(track.url);
        } else {
            this.videoPlayer.src = track.url;
            this.setQualityControlState(false, ['Auto']);
        }

        this.updateNowPlaying();
        this.renderPlaylist();

        if (this.isPlaying) {
            this.safePlay(this.getCurrentPlayer());
        }
    }

    setupHls(url) {
        if (window.Hls && Hls.isSupported()) {
            this.hls = new Hls({
                capLevelToPlayerSize: true,
                startLevel: -1,
                maxBufferLength: 30
            });

            this.hls.loadSource(url);
            this.hls.attachMedia(this.videoPlayer);

            this.hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                const labels = ['Auto', ...this.getQualityLabels(data.levels || [])];
                this.setQualityControlState(true, labels);
                if (this.isPlaying) {
                    this.safePlay(this.videoPlayer);
                }
            });

            this.hls.on(Hls.Events.ERROR, (_, data) => {
                if (data?.fatal) {
                    console.error('HLS playback error:', data);
                }
            });

            return;
        }

        if (this.videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            this.videoPlayer.src = url;
            this.setQualityControlState(false, ['Auto']);
            return;
        }

        this.videoPlayer.src = url;
        this.setQualityControlState(false, ['Auto']);
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
            return `Level ${index + 1}`;
        });
    }

    setQualityControlState(enabled, options) {
        this.qualitySelect.innerHTML = '';
        options.forEach((option, index) => {
            const item = document.createElement('option');
            item.value = String(index === 0 ? 'auto' : index - 1);
            item.textContent = option;
            this.qualitySelect.appendChild(item);
        });
        this.qualitySelect.value = 'auto';
        this.qualitySelect.disabled = !enabled;
    }

    setQuality(value) {
        if (!this.hls) return;
        this.hls.currentLevel = value === 'auto' ? -1 : Number(value);
    }

    updateNowPlaying() {
        const track = this.playlist[this.currentIndex];
        this.nowPlayingTitle.textContent = track.title;
        this.nowPlayingArtist.textContent = track.url;
        this.nowPlayingDuration.textContent = this.formatTime(track.duration || 0);
    }

    togglePlay() {
        const player = this.getCurrentPlayer();
        if (this.isPlaying) {
            player.pause();
            this.isPlaying = false;
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            this.safePlay(player);
            this.isPlaying = true;
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }

    safePlay(player) {
        const playPromise = player.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch((error) => {
                console.error('Playback error:', error);
                this.isPlaying = false;
                this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
            });
        }
    }

    nextTrack() {
        if (this.playlist.length === 0) return;
        if (this.isShuffle) {
            this.currentIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        }
        this.loadTrack(this.currentIndex);
    }

    previousTrack() {
        if (this.playlist.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(this.currentIndex);
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('active');
    }

    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        this.repeatBtn.classList.toggle('active', this.repeatMode > 0);
        this.repeatBtn.innerHTML = this.repeatMode === 2
            ? '<i class="fas fa-redo"></i> <span>1</span>'
            : '<i class="fas fa-redo"></i>';
    }

    onTrackEnded() {
        if (this.repeatMode === 2) {
            this.loadTrack(this.currentIndex);
            this.safePlay(this.getCurrentPlayer());
        } else if (this.repeatMode === 1 || this.autoPlay) {
            this.nextTrack();
        }
    }

    setVolume(value) {
        this.getCurrentPlayer().volume = value / 100;
    }

    updateProgress() {
        const player = this.getCurrentPlayer();
        if (player.duration && Number.isFinite(player.duration)) {
            const percent = (player.currentTime / player.duration) * 100;
            this.progressFill.style.width = `${percent}%`;
            this.progressHandle.style.left = `${percent}%`;
            this.currentTimeEl.textContent = this.formatTime(player.currentTime);
            return;
        }

        this.progressFill.style.width = '0%';
        this.progressHandle.style.left = '0%';
        this.currentTimeEl.textContent = this.formatTime(player.currentTime || 0);
    }

    updateDuration() {
        const player = this.getCurrentPlayer();
        this.durationEl.textContent = this.formatTime(player.duration);
    }

    seek(e) {
        const player = this.getCurrentPlayer();
        if (!player.duration || !Number.isFinite(player.duration)) return;
        const rect = this.progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        player.currentTime = percent * player.duration;
    }

    startDrag(e) {
        e.preventDefault();
        const player = this.getCurrentPlayer();
        if (!player.duration || !Number.isFinite(player.duration)) return;

        const onMouseMove = (event) => {
            const rect = this.progressBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            player.currentTime = percent * player.duration;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    filterPlaylist(query) {
        const items = document.querySelectorAll('.playlist-item');
        items.forEach((item) => {
            const title = item.querySelector('.playlist-item-title').textContent;
            item.style.display = title.toLowerCase().includes(query.toLowerCase()) ? 'flex' : 'none';
        });
    }

    resetPlaylist() {
        this.searchInput.value = '';
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.loadFixedChannels();
    }

    formatTime(seconds) {
        if (!Number.isFinite(seconds)) return 'LIVE';
        const safeSeconds = Math.max(0, seconds);
        const mins = Math.floor(safeSeconds / 60);
        const secs = Math.floor(safeSeconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

    setTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
        localStorage.setItem('theme', theme);
    }

    saveSettings() {
        localStorage.setItem('autoPlay', this.autoPlay);
    }

    loadSettings() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const savedAutoPlay = localStorage.getItem('autoPlay') !== 'false';

        this.themeSelect.value = savedTheme;
        this.autoPlayToggle.checked = savedAutoPlay;
        this.autoPlay = savedAutoPlay;
        this.setTheme(savedTheme);
        this.setVolume(this.volumeSlider.value);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new M3UPlayer();
});
