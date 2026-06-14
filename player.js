class M3UPlayer {
    constructor() {
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 0;
        this.autoPlay = true;
        this.isVideo = false;
        
        this.initElements();
        this.attachEventListeners();
        this.loadSettings();
    }

    initElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.urlInput = document.getElementById('urlInput');
        this.loadUrlBtn = document.getElementById('loadUrlBtn');

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
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.style.borderColor = 'var(--primary)';
        });
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.style.borderColor = 'rgba(99, 102, 241, 0.5)';
        });
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.style.borderColor = 'rgba(99, 102, 241, 0.5)';
            if (e.dataTransfer.files.length > 0) {
                this.loadFile(e.dataTransfer.files[0]);
            }
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.loadFile(e.target.files[0]);
            }
        });

        this.loadUrlBtn.addEventListener('click', () => this.loadFromUrl());

        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        this.volumeSlider.addEventListener('change', (e) => this.setVolume(e.target.value));

        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.progressHandle.addEventListener('mousedown', (e) => this.startDrag(e));

        this.searchInput.addEventListener('input', (e) => this.filterPlaylist(e.target.value));
        this.clearPlaylistBtn.addEventListener('click', () => this.clearPlaylist());

        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.autoPlayToggle.addEventListener('change', (e) => {
            this.autoPlay = e.target.checked;
            this.saveSettings();
        });
        this.themeSelect.addEventListener('change', (e) => this.setTheme(e.target.value));

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        this.getCurrentPlayer().addEventListener('timeupdate', () => this.updateProgress());
        this.getCurrentPlayer().addEventListener('ended', () => this.onTrackEnded());
        this.getCurrentPlayer().addEventListener('loadedmetadata', () => this.updateDuration());
    }

    getCurrentPlayer() {
        return this.isVideo ? this.videoPlayer : this.audioPlayer;
    }

    async loadFile(file) {
        try {
            const text = await file.text();
            this.parseM3U(text);
            this.updateUI();
        } catch (error) {
            console.error('Error loading file:', error);
            alert('Error loading file. Please check the format.');
        }
    }

    async loadFromUrl() {
        const url = this.urlInput.value.trim();
        if (!url) {
            alert('Please enter a valid URL');
            return;
        }

        try {
            const response = await fetch(url);
            const text = await response.text();
            this.parseM3U(text);
            this.updateUI();
            this.urlInput.value = '';
        } catch (error) {
            console.error('Error loading from URL:', error);
            alert('Error loading playlist from URL. Make sure the URL is correct.');
        }
    }

    parseM3U(text) {
        this.playlist = [];
        const lines = text.split('\n');
        let currentTrack = { title: '', url: '', duration: 0 };

        for (let line of lines) {
            line = line.trim();

            if (line.startsWith('#EXTINF')) {
                const match = line.match(/#EXTINF:(-?\d+),(.+)/);
                if (match) {
                    currentTrack.duration = parseInt(match[1]);
                    currentTrack.title = match[2].trim() || 'Unknown Track';
                }
            } else if (line && !line.startsWith('#') && line.length > 0) {
                currentTrack.url = line;
                if (currentTrack.url) {
                    this.playlist.push({ ...currentTrack });
                    currentTrack = { title: '', url: '', duration: 0 };
                }
            }
        }
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
                    <div class="playlist-item-duration">${this.formatTime(track.duration)}</div>
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
        const player = this.getCurrentPlayer();

        this.isVideo = /\.(m3u8|mp4|webm|mov)$/i.test(track.url);

        player.src = track.url;
        this.updateNowPlaying();
        this.renderPlaylist();

        if (this.isPlaying) {
            player.play();
        }
    }

    updateNowPlaying() {
        const track = this.playlist[this.currentIndex];
        this.nowPlayingTitle.textContent = track.title;
        this.nowPlayingArtist.textContent = track.url;
        this.nowPlayingDuration.textContent = this.formatTime(track.duration);
    }

    togglePlay() {
        const player = this.getCurrentPlayer();
        if (this.isPlaying) {
            player.pause();
            this.isPlaying = false;
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            player.play();
            this.isPlaying = true;
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }

    nextTrack() {
        if (this.isShuffle) {
            this.currentIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        }
        this.loadTrack(this.currentIndex);
        if (this.isPlaying) {
            this.getCurrentPlayer().play();
        }
    }

    previousTrack() {
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(this.currentIndex);
        if (this.isPlaying) {
            this.getCurrentPlayer().play();
        }
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('active');
    }

    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        this.repeatBtn.classList.toggle('active', this.repeatMode > 0);
        if (this.repeatMode === 2) {
            this.repeatBtn.innerHTML = '<i class="fas fa-redo"></i> <span>1</span>';
        } else {
            this.repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
        }
    }

    onTrackEnded() {
        if (this.repeatMode === 2) {
            this.loadTrack(this.currentIndex);
            this.getCurrentPlayer().play();
        } else if (this.repeatMode === 1 || this.autoPlay) {
            this.nextTrack();
        }
    }

    setVolume(value) {
        const player = this.getCurrentPlayer();
        player.volume = value / 100;
    }

    updateProgress() {
        const player = this.getCurrentPlayer();
        if (player.duration) {
            const percent = (player.currentTime / player.duration) * 100;
            this.progressFill.style.width = percent + '%';
            this.progressHandle.style.left = percent + '%';
            this.currentTimeEl.textContent = this.formatTime(player.currentTime);
        }
    }

    updateDuration() {
        const player = this.getCurrentPlayer();
        this.durationEl.textContent = this.formatTime(player.duration);
    }

    seek(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const player = this.getCurrentPlayer();
        player.currentTime = percent * player.duration;
    }

    startDrag(e) {
        e.preventDefault();
        const onMouseMove = (e) => {
            const rect = this.progressBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const player = this.getCurrentPlayer();
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
        items.forEach(item => {
            const title = item.querySelector('.playlist-item-title').textContent;
            item.style.display = title.toLowerCase().includes(query.toLowerCase()) ? 'flex' : 'none';
        });
    }

    clearPlaylist() {
        if (confirm('Are you sure you want to clear the playlist?')) {
            this.playlist = [];
            this.currentIndex = 0;
            this.isPlaying = false;
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.updateUI();
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    handleKeyboard(e) {
        if (e.target === this.searchInput || e.target === this.urlInput) return;

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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new M3UPlayer();
});