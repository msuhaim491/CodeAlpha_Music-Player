(function () {
	var audio = document.getElementById('audio');
	var titleEl = document.getElementById('title');
	var artistEl = document.getElementById('artist');
	var artworkEl = document.getElementById('artwork');
	var currentEl = document.getElementById('current');
	var durationEl = document.getElementById('duration');
	var progressEl = document.getElementById('progress');
	var barEl = document.getElementById('bar');
	var volumeEl = document.getElementById('volume');
	var muteBtn = document.getElementById('mute');
	var playBtn = document.getElementById('play');
	var prevBtn = document.getElementById('prev');
	var nextBtn = document.getElementById('next');
	var listEl = document.getElementById('playlist');
	var playIcon = playBtn.querySelector('i');
	var muteIcon = muteBtn.querySelector('i');
    function setPlayStateIcon(paused) {
        if (!playIcon) return;
        playIcon.classList.remove('fa-play', 'fa-pause');
        playIcon.classList.add(paused ? 'fa-play' : 'fa-pause');
    }

    function setMuteStateIcon(muted) {
        if (!muteIcon) return;
        muteIcon.classList.remove('fa-volume-high', 'fa-volume-xmark');
        muteIcon.classList.add(muted ? 'fa-volume-xmark' : 'fa-volume-high');
    }


	// Local playlist sourced from ./assets
	var tracks = [
		{ src: 'assets/Jhol(KoshalWorld.Com).mp3', title: 'Jhol', artist: 'Maanu', cover: 'assets/jhol-acoustic-maanu-500-500.jpg', color: '#0ea5e9' },
		{ src: 'assets/Stfu Okay Stfu 128 Kbps.mp3', title: 'STFU', artist: 'AP Dhillon', cover: 'assets/stfu-ap-dhillon.webp', color: '#a78bfa' },
		{ src: 'assets/khayaal.mp3', title: 'Khayaal', artist: '—', cover: 'assets/1839718585002560-1839718760647380.jpeg', color: '#22c55e' }
	];

	var index = 0;
	var autoplay = true;

	function fmtTime(s) {
		s = s || 0;
		var m = Math.floor(s / 60);
		var r = Math.floor(s % 60);
		return m + ':' + (r < 10 ? '0' + r : r);
	}

	function setArtworkTint(hex) {
		// keep a subtle tint behind images
		artworkEl.style.backgroundColor = '#111827';
	}

	function setTrack(i) {
		index = (i + tracks.length) % tracks.length;
		var t = tracks[index];
		audio.src = t.src;
		titleEl.textContent = t.title;
		artistEl.textContent = t.artist;
		setArtworkTint(t.color || '#1f2937');
		// If track has a cover image URL, set it as background; else show tint only
		if (t.cover) {
			artworkEl.style.backgroundImage = 'url("' + t.cover + '")';
		} else {
			artworkEl.style.backgroundImage = 'none';
		}
		// reset UI counters
		currentEl.textContent = '0:00';
		durationEl.textContent = '0:00';
		barEl.style.width = '0%';
		Array.prototype.forEach.call(listEl.children, function (li, n) {
			li.classList.toggle('active', n === index);
		});
	}

	function play() {
		var p = audio.play();
		if (p && typeof p.then === 'function') { p.catch(function(){}); }
		setPlayStateIcon(false);
	}
	function pause() { audio.pause(); setPlayStateIcon(true); }
	function togglePlay() { audio.paused ? play() : pause(); }
	function next() { setTrack(index + 1); play(); }
	function prev() { setTrack(index - 1); play(); }

	function onTime() {
		var cur = audio.currentTime || 0;
		var dur = audio.duration || 0;
		var pct = dur ? (cur / dur) * 100 : 0;
		currentEl.textContent = fmtTime(cur);
		if (isFinite(dur) && dur) durationEl.textContent = fmtTime(dur);
		barEl.style.width = pct + '%';
		progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
	}

	function seek(clientX) {
		var rect = progressEl.getBoundingClientRect();
		var x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
		var pct = x / rect.width;
		var dur = audio.duration || 0;
		if (dur) audio.currentTime = pct * dur;
	}

	function buildList() {
		listEl.innerHTML = '';
		tracks.forEach(function (t, i) {
			var li = document.createElement('li');
			var left = document.createElement('div');
			var right = document.createElement('div');
			var tt = document.createElement('div'); tt.className = 'track-title'; tt.textContent = t.title;
			var ar = document.createElement('div'); ar.className = 'track-artist'; ar.textContent = t.artist;
			var tm = document.createElement('div'); tm.className = 'track-time'; tm.textContent = t.dur || '';
			left.appendChild(tt); left.appendChild(ar);
			right.appendChild(tm);
			li.appendChild(left); li.appendChild(right);
			li.addEventListener('click', function () { setTrack(i); play(); });
			listEl.appendChild(li);
		});
	}

	// Events
	audio.addEventListener('loadedmetadata', onTime);
	audio.addEventListener('loadeddata', onTime);
	audio.addEventListener('timeupdate', onTime);
	audio.addEventListener('ended', function () { if (autoplay) next(); });
	audio.addEventListener('play', function(){ setPlayStateIcon(false); });
	audio.addEventListener('pause', function(){ setPlayStateIcon(true); });

	playBtn.addEventListener('click', togglePlay);
	prevBtn.addEventListener('click', prev);
	nextBtn.addEventListener('click', next);

	muteBtn.addEventListener('click', function () {
		audio.muted = !audio.muted;
		setMuteStateIcon(audio.muted);
	});
	volumeEl.addEventListener('input', function () {
		audio.volume = parseFloat(volumeEl.value);
	});

	var dragging = false;
	progressEl.addEventListener('pointerdown', function (e) { dragging = true; progressEl.setPointerCapture(e.pointerId); seek(e.clientX); });
	progressEl.addEventListener('pointermove', function (e) { if (dragging) seek(e.clientX); });
	progressEl.addEventListener('pointerup', function (e) { dragging = false; progressEl.releasePointerCapture(e.pointerId); });
	// click/touch fallback
	progressEl.addEventListener('click', function(e){ if (!dragging) seek(e.clientX); });
	progressEl.addEventListener('keydown', function (e) {
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			var dur = audio.duration || 0; if (!dur) return;
			var step = dur / 50; // 2% steps
			audio.currentTime = Math.max(0, Math.min(dur, audio.currentTime + (e.key === 'ArrowRight' ? step : -step)));
			return e.preventDefault();
		}
	});

	// Init
	setPlayStateIcon(audio.paused);
	setMuteStateIcon(audio.muted);
	buildList();
	setTrack(0);
})();
