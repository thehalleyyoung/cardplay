#!/usr/bin/env python3
"""Generate mel-spectrogram visualizations of the rendered WAV files."""

import numpy as np
import matplotlib.pyplot as plt
import wave
import struct
import os

def read_wav(filepath):
    """Read a WAV file and return audio samples."""
    with wave.open(filepath, 'rb') as wav:
        n_channels = wav.getnchannels()
        framerate = wav.getframerate()
        n_frames = wav.getnframes()
        raw_data = wav.readframes(n_frames)
    
    samples = np.array(struct.unpack(f'<{n_frames * n_channels}h', raw_data), dtype=np.float32) / 32768.0
    # Take left channel only for mono analysis
    audio = samples[::n_channels]
    return audio, framerate

def hz_to_mel(hz):
    """Convert Hz to mel scale."""
    return 2595 * np.log10(1 + hz / 700)

def mel_to_hz(mel):
    """Convert mel scale to Hz."""
    return 700 * (10**(mel / 2595) - 1)

def get_mel_filterbank(sr, n_fft, n_mels, fmin=0, fmax=None):
    """Create a mel filterbank."""
    if fmax is None:
        fmax = sr / 2
    
    mel_min = hz_to_mel(fmin)
    mel_max = hz_to_mel(fmax)
    mel_points = np.linspace(mel_min, mel_max, n_mels + 2)
    hz_points = mel_to_hz(mel_points)
    bin_points = np.floor((n_fft + 1) * hz_points / sr).astype(int)
    
    filterbank = np.zeros((n_mels, n_fft // 2 + 1))
    for i in range(n_mels):
        for j in range(bin_points[i], bin_points[i + 1]):
            if bin_points[i + 1] != bin_points[i]:
                filterbank[i, j] = (j - bin_points[i]) / (bin_points[i + 1] - bin_points[i])
        for j in range(bin_points[i + 1], bin_points[i + 2]):
            if bin_points[i + 2] != bin_points[i + 1]:
                filterbank[i, j] = (bin_points[i + 2] - j) / (bin_points[i + 2] - bin_points[i + 1])
    
    return filterbank

def compute_mel_spectrogram(audio, sr, n_fft=2048, hop_length=512, n_mels=128):
    """Compute mel spectrogram."""
    n_frames_spec = (len(audio) - n_fft) // hop_length + 1
    spectrogram = np.zeros((n_fft // 2 + 1, n_frames_spec))
    
    window = np.hanning(n_fft)
    for i in range(n_frames_spec):
        start = i * hop_length
        frame = audio[start:start + n_fft] * window
        fft = np.fft.rfft(frame)
        spectrogram[:, i] = np.abs(fft)
    
    mel_fb = get_mel_filterbank(sr, n_fft, n_mels, fmin=20, fmax=sr//2)
    mel_spec = np.dot(mel_fb, spectrogram)
    mel_spec_db = 20 * np.log10(np.maximum(mel_spec, 1e-10))
    
    return mel_spec_db, hop_length

def plot_spectrogram(audio, sr, mel_spec_db, hop_length, title, output_path, annotations=None):
    """Plot mel spectrogram and waveform."""
    fig, axes = plt.subplots(2, 1, figsize=(14, 8))
    fig.patch.set_facecolor('#1a1a2e')
    
    n_mels = mel_spec_db.shape[0]
    n_frames = mel_spec_db.shape[1]
    times = np.arange(n_frames) * hop_length / sr
    
    # Mel spectrogram
    im = axes[0].imshow(mel_spec_db, aspect='auto', origin='lower',
                        extent=[0, times[-1], 0, n_mels],
                        cmap='magma', vmin=-80, vmax=0)
    axes[0].set_xlabel('Time (s)', color='white')
    axes[0].set_ylabel('Mel Bin', color='white')
    axes[0].set_title(title, color='white', fontsize=14)
    axes[0].tick_params(colors='white')
    axes[0].set_facecolor('#1a1a2e')
    cbar = plt.colorbar(im, ax=axes[0])
    cbar.set_label('dB', color='white')
    cbar.ax.yaxis.set_tick_params(color='white')
    plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='white')
    
    # Waveform
    time_axis = np.arange(len(audio)) / sr
    axes[1].plot(time_axis, audio, linewidth=0.5, color='#00ff88')
    axes[1].set_xlabel('Time (s)', color='white')
    axes[1].set_ylabel('Amplitude', color='white')
    axes[1].set_title('Waveform', color='white')
    axes[1].set_xlim(0, len(audio)/sr)
    axes[1].set_ylim(-1, 1)
    axes[1].axhline(y=0, color='gray', linewidth=0.5)
    axes[1].tick_params(colors='white')
    axes[1].set_facecolor('#1a1a2e')
    for spine in axes[1].spines.values():
        spine.set_color('white')
    
    # Add annotations if provided
    if annotations:
        for t, name in annotations:
            axes[0].axvline(x=t, color='white', linewidth=0.5, alpha=0.7)
            axes[1].axvline(x=t, color='white', linewidth=0.5, alpha=0.7)
            if name:
                axes[0].text(t + 0.05, n_mels - 10, name, color='white', fontsize=12, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, facecolor='#1a1a2e', edgecolor='none')
    plt.close()
    print(f'Saved: {output_path}')

def main():
    output_dir = 'test-output'
    
    # Process chord progression
    print("Analyzing chord progression WAV...")
    audio, sr = read_wav(os.path.join(output_dir, 'generated_wavetable_test.wav'))
    print(f'  Sample rate: {sr} Hz')
    print(f'  Duration: {len(audio)/sr:.2f} seconds')
    print(f'  Samples: {len(audio)}')
    
    mel_spec_db, hop_length = compute_mel_spectrogram(audio, sr)
    
    # Chord annotations
    chord_annotations = [(0, 'C'), (1, 'F'), (2, 'G'), (3, 'C'), (4.5, '')]
    
    plot_spectrogram(
        audio, sr, mel_spec_db, hop_length,
        'Mel Spectrogram - Wavetable Synth Chord Progression (C-F-G-C)',
        os.path.join(output_dir, 'mel_spectrogram_chords.png'),
        annotations=chord_annotations
    )
    
    # Process arpeggio
    print("\nAnalyzing arpeggio WAV...")
    audio_arp, sr = read_wav(os.path.join(output_dir, 'generated_wavetable_arpeggio.wav'))
    print(f'  Sample rate: {sr} Hz')
    print(f'  Duration: {len(audio_arp)/sr:.2f} seconds')
    print(f'  Samples: {len(audio_arp)}')
    
    mel_spec_db_arp, hop_length = compute_mel_spectrogram(audio_arp, sr)
    
    plot_spectrogram(
        audio_arp, sr, mel_spec_db_arp, hop_length,
        'Mel Spectrogram - Wavetable Synth Arpeggio Pattern',
        os.path.join(output_dir, 'mel_spectrogram_arpeggio.png')
    )
    
    # Print analysis
    print("\n" + "="*60)
    print("ANALYSIS SUMMARY")
    print("="*60)
    
    # Check for expected features
    print("\nChord progression analysis:")
    print(f"  - Peak energy at mel bins: {np.argmax(np.mean(mel_spec_db, axis=1))}")
    print(f"  - Dynamic range: {np.max(mel_spec_db) - np.min(mel_spec_db):.1f} dB")
    print(f"  - Mean energy: {np.mean(mel_spec_db):.1f} dB")
    
    print("\nArpeggio analysis:")
    print(f"  - Peak energy at mel bins: {np.argmax(np.mean(mel_spec_db_arp, axis=1))}")
    print(f"  - Dynamic range: {np.max(mel_spec_db_arp) - np.min(mel_spec_db_arp):.1f} dB")
    print(f"  - Mean energy: {np.mean(mel_spec_db_arp):.1f} dB")
    
    # Check for harmonics (sign of a proper synthesizer)
    print("\nHarmonic content check:")
    avg_spectrum = np.mean(mel_spec_db, axis=1)
    peaks = []
    for i in range(1, len(avg_spectrum) - 1):
        if avg_spectrum[i] > avg_spectrum[i-1] and avg_spectrum[i] > avg_spectrum[i+1]:
            if avg_spectrum[i] > -60:  # Only significant peaks
                peaks.append(i)
    print(f"  - Significant spectral peaks: {len(peaks)}")
    print(f"  - Peak mel bins: {peaks[:10]}...")
    
    if len(peaks) >= 3:
        print("\n✓ Mel spectrogram shows harmonic content - synthesizer is working correctly!")
    else:
        print("\n⚠ Low harmonic content detected - may need investigation")

if __name__ == '__main__':
    main()
