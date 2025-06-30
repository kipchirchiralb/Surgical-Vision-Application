import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Brain, 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Settings,
  Play,
  Pause,
  SkipForward,
  SkipBack
} from 'lucide-react';

interface VoiceCommand {
  id: string;
  command: string;
  action: string;
  timestamp: Date;
  confidence: number;
  executed: boolean;
}

interface VoiceControlInterfaceProps {
  onCommand?: (command: string, action: string) => void;
  onVoiceToggle?: (enabled: boolean) => void;
}

const VoiceControlInterface: React.FC<VoiceControlInterfaceProps> = ({
  onCommand,
  onVoiceToggle
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [voiceResponse, setVoiceResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Voice commands mapping
  const voiceCommands = {
    // Navigation commands
    'show dashboard': 'navigate_dashboard',
    'go to dashboard': 'navigate_dashboard',
    'open upload': 'navigate_upload',
    'show admin panel': 'navigate_admin',
    
    // Viewer commands
    'zoom in': 'zoom_in',
    'zoom out': 'zoom_out',
    'reset view': 'reset_view',
    'rotate left': 'rotate_left',
    'rotate right': 'rotate_right',
    'next slice': 'next_slice',
    'previous slice': 'prev_slice',
    'play animation': 'play_animation',
    'pause animation': 'pause_animation',
    
    // Layer controls
    'show bone': 'show_bone',
    'hide bone': 'hide_bone',
    'show vessels': 'show_vessels',
    'hide vessels': 'hide_vessels',
    'show tumor': 'show_tumor',
    'hide tumor': 'hide_tumor',
    'toggle wireframe': 'toggle_wireframe',
    
    // Analysis commands
    'start ai analysis': 'start_ai_analysis',
    'generate report': 'generate_report',
    'show risk assessment': 'show_risk_assessment',
    'run segmentation': 'run_segmentation',
    
    // Medical queries
    'show tumor location': 'highlight_tumor',
    'highlight vessels': 'highlight_vessels',
    'show surgical path': 'show_surgical_path',
    'calculate distance': 'measure_distance',
    'add annotation': 'add_annotation',
    
    // Window/Level commands
    'increase contrast': 'increase_contrast',
    'decrease contrast': 'decrease_contrast',
    'increase brightness': 'increase_brightness',
    'decrease brightness': 'decrease_brightness',
    'auto window level': 'auto_window_level',
    
    // System commands
    'take screenshot': 'take_screenshot',
    'save current view': 'save_view',
    'export data': 'export_data',
    'help': 'show_help'
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
      recognitionRef.current.onend = handleSpeechEnd;
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSpeechResult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const confidence = event.results[i][0].confidence;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
        setConfidence(confidence * 100);
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      processVoiceCommand(finalTranscript.toLowerCase().trim());
    } else {
      setCurrentCommand(interimTranscript);
    }
  };

  const handleSpeechError = (event: any) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    
    if (event.error === 'not-allowed') {
      speak('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const handleSpeechEnd = () => {
    if (isEnabled && isListening) {
      // Restart listening if still enabled
      setTimeout(() => {
        if (recognitionRef.current && isEnabled) {
          recognitionRef.current.start();
        }
      }, 100);
    }
  };

  const processVoiceCommand = (command: string) => {
    console.log('Processing voice command:', command);
    
    // Find matching command
    let matchedAction = '';
    let matchedCommand = '';
    
    for (const [voiceCmd, action] of Object.entries(voiceCommands)) {
      if (command.includes(voiceCmd)) {
        matchedAction = action;
        matchedCommand = voiceCmd;
        break;
      }
    }

    // Handle natural language queries
    if (!matchedAction) {
      if (command.includes('tumor') && command.includes('where')) {
        matchedAction = 'highlight_tumor';
        matchedCommand = 'locate tumor';
      } else if (command.includes('risk') && (command.includes('what') || command.includes('show'))) {
        matchedAction = 'show_risk_assessment';
        matchedCommand = 'show risk assessment';
      } else if (command.includes('distance') && command.includes('measure')) {
        matchedAction = 'measure_distance';
        matchedCommand = 'measure distance';
      }
    }

    const voiceCommand: VoiceCommand = {
      id: Date.now().toString(),
      command: command,
      action: matchedAction || 'unknown',
      timestamp: new Date(),
      confidence: confidence,
      executed: !!matchedAction
    };

    setCommandHistory(prev => [voiceCommand, ...prev.slice(0, 9)]);
    setCurrentCommand('');

    if (matchedAction) {
      // Execute command
      if (onCommand) {
        onCommand(matchedCommand, matchedAction);
      }
      
      // Provide voice feedback
      const responses = {
        'navigate_dashboard': 'Navigating to dashboard',
        'zoom_in': 'Zooming in',
        'zoom_out': 'Zooming out',
        'reset_view': 'Resetting view',
        'show_vessels': 'Showing blood vessels',
        'hide_vessels': 'Hiding blood vessels',
        'start_ai_analysis': 'Starting AI analysis',
        'highlight_tumor': 'Highlighting tumor location',
        'show_risk_assessment': 'Displaying risk assessment',
        'take_screenshot': 'Taking screenshot'
      };
      
      const response = responses[matchedAction as keyof typeof responses] || 'Command executed';
      speak(response);
    } else {
      speak('Command not recognized. Say "help" for available commands.');
    }
  };

  const speak = (text: string) => {
    if (synthRef.current && text) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      setVoiceResponse(text);
      synthRef.current.speak(utterance);
    }
  };

  const toggleVoiceControl = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    
    if (newEnabled) {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
        speak('Voice control activated. You can now use voice commands.');
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        speak('Voice control deactivated.');
      }
    }
    
    if (onVoiceToggle) {
      onVoiceToggle(newEnabled);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setVoiceResponse('');
    }
  };

  const showHelp = () => {
    const helpText = `Available voice commands include: zoom in, zoom out, reset view, show vessels, hide vessels, start AI analysis, generate report, next slice, previous slice, and many more. You can also ask natural questions like "where is the tumor" or "what is the risk level".`;
    speak(helpText);
  };

  return (
    <div className="space-y-6">
      {/* Voice Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                <Mic className="h-6 w-6 mr-2 text-blue-600" />
                Voice Control Interface
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Hands-free medical imaging control with natural language processing
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <VolumeX className="h-4 w-4 mr-2" />
                  Stop Speaking
                </button>
              )}
              
              <button
                onClick={toggleVoiceControl}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isEnabled
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isEnabled ? (
                  <>
                    <Mic className="h-5 w-5 mr-2" />
                    Voice Active
                  </>
                ) : (
                  <>
                    <MicOff className="h-5 w-5 mr-2" />
                    Enable Voice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Status */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Current Status</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Voice Control:</span>
                  <div className="flex items-center">
                    {isEnabled ? (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-slate-400 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-slate-500">Inactive</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Listening:</span>
                  <div className="flex items-center">
                    {isListening ? (
                      <>
                        <Mic className="h-4 w-4 text-blue-600 mr-2 animate-pulse" />
                        <span className="text-sm font-medium text-blue-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <MicOff className="h-4 w-4 text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-500">No</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Speaking:</span>
                  <div className="flex items-center">
                    {isSpeaking ? (
                      <>
                        <Volume2 className="h-4 w-4 text-orange-600 mr-2 animate-pulse" />
                        <span className="text-sm font-medium text-orange-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-4 w-4 text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-500">No</span>
                      </>
                    )}
                  </div>
                </div>

                {confidence > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>Recognition Confidence:</span>
                      <span className="font-medium">{confidence.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${confidence}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Command */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Live Recognition</h4>
              
              <div className="min-h-32 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                {currentCommand ? (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Listening...</p>
                    <p className="text-slate-900 font-medium">{currentCommand}</p>
                  </div>
                ) : isListening ? (
                  <div className="text-center text-slate-500">
                    <Mic className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm">Listening for commands...</p>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <MicOff className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Voice control disabled</p>
                  </div>
                )}
              </div>

              {voiceResponse && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Volume2 className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{voiceResponse}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Commands */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900">Quick Commands</h4>
                <button
                  onClick={showHelp}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show All Commands
                </button>
              </div>
              
              <div className="space-y-2">
                {[
                  { text: 'Zoom in', icon: ZoomIn },
                  { text: 'Show vessels', icon: Eye },
                  { text: 'Reset view', icon: RotateCcw },
                  { text: 'Start AI analysis', icon: Brain },
                  { text: 'Next slice', icon: SkipForward },
                  { text: 'Toggle layers', icon: Layers }
                ].map((cmd, index) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => processVoiceCommand(cmd.text.toLowerCase())}
                      className="w-full flex items-center p-2 text-left hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Icon className="h-4 w-4 text-slate-400 mr-3" />
                      <span className="text-sm text-slate-700">"{cmd.text}"</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Command History ({commandHistory.length})
            </h3>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {commandHistory.map((cmd) => (
                <div 
                  key={cmd.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    cmd.executed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">"{cmd.command}"</p>
                    <p className="text-xs text-slate-500">
                      {cmd.timestamp.toLocaleTimeString()} • {cmd.confidence.toFixed(0)}% confidence
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    {cmd.executed ? (
                      <div className="flex items-center text-green-600">
                        <Brain className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Executed</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Not recognized</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voice Commands Reference */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-4">Voice Commands Reference</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Navigation</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• "Show dashboard"</li>
              <li>• "Open upload"</li>
              <li>• "Show admin panel"</li>
              <li>• "Go to dashboard"</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Viewer Controls</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• "Zoom in/out"</li>
              <li>• "Reset view"</li>
              <li>• "Next/Previous slice"</li>
              <li>• "Play/Pause animation"</li>
              <li>• "Show/Hide vessels"</li>
              <li>• "Toggle wireframe"</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Analysis</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• "Start AI analysis"</li>
              <li>• "Generate report"</li>
              <li>• "Show risk assessment"</li>
              <li>• "Where is the tumor?"</li>
              <li>• "Measure distance"</li>
              <li>• "Take screenshot"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceControlInterface;