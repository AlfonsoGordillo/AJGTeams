// Real WebRTC P2P connection handling using public Google STUN servers

export interface WebRTCOptions {
  onRemoteStream: (peerId: string, stream: MediaStream) => void;
  onSendSignal: (targetPeerId: string, signal: any) => void;
  localStream: MediaStream | null;
}

export class WebRTCManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStream: (peerId: string, stream: MediaStream) => void;
  private onSendSignal: (targetPeerId: string, signal: any) => void;

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  constructor(options: WebRTCOptions) {
    this.localStream = options.localStream;
    this.onRemoteStream = options.onRemoteStream;
    this.onSendSignal = options.onSendSignal;
  }

  public setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
    // Replace tracks for all existing peer connections
    if (stream) {
      this.peers.forEach((pc) => {
        const senders = pc.getSenders();
        stream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track).catch((e) => console.warn('replaceTrack warning:', e));
          } else {
            try {
              pc.addTrack(track, stream);
            } catch (e) {
              console.warn('addTrack warning:', e);
            }
          }
        });
      });
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10,
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    } else {
      // Ensure transceivers exist to receive audio and video
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.addTransceiver('video', { direction: 'recvonly' });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onRemoteStream(peerId, event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onSendSignal(peerId, {
          type: 'candidate',
          candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
        });
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  public async initiateCall(peerId: string) {
    const pc = this.createPeerConnection(peerId);
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      this.onSendSignal(peerId, {
        type: 'offer',
        sdp: offer,
      });
    } catch (err) {
      console.error('Failed to create offer for peer', peerId, err);
    }
  }

  public async handleSignal(peerId: string, signal: any) {
    let pc = this.peers.get(peerId);
    if (!pc) {
      pc = this.createPeerConnection(peerId);
    }

    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        // Flush any queued candidates
        await this.flushPendingCandidates(peerId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.onSendSignal(peerId, {
          type: 'answer',
          sdp: answer,
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        // Flush any queued candidates
        await this.flushPendingCandidates(peerId, pc);
      } else if (signal.type === 'candidate' && signal.candidate) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn('Error adding ICE candidate directly:', e);
          }
        } else {
          // Queue candidate until remote description is set
          const queue = this.pendingCandidates.get(peerId) || [];
          queue.push(signal.candidate);
          this.pendingCandidates.set(peerId, queue);
        }
      }
    } catch (err) {
      console.error('Error handling WebRTC signal from peer', peerId, err);
    }
  }

  private async flushPendingCandidates(peerId: string, pc: RTCPeerConnection) {
    const queue = this.pendingCandidates.get(peerId);
    if (queue && queue.length > 0) {
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding queued ICE candidate:', e);
        }
      }
      this.pendingCandidates.delete(peerId);
    }
  }

  public removePeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
      this.pendingCandidates.delete(peerId);
    }
  }

  public closeAll() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.pendingCandidates.clear();
  }
}
