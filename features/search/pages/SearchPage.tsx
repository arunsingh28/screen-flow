
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';
import { Candidate } from '../../../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  results?: Candidate[];
}

const SearchPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [scope, setScope] = useState('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Talent Scout. I can help you find the perfect candidate from your library. Try asking me something like \"Find a Senior React Developer with 5 years of experience\" or \"Who are the best matches for the Product Manager role?\"",
      timestamp: new Date()
    }
  ]);

  // Dummy Candidate Result for Demo
  const dummyResults: Candidate[] = [
    {
      id: 'c1',
      name: 'Sarah Connor',
      email: 'sarah.c@example.com',
      currentRole: 'Frontend Lead',
      experienceYears: 6,
      matchScore: 95,
      status: 'new',
      skillsMatched: ['React', 'TypeScript', 'Node.js'],
      skillsMissing: [],
      education: 'BS CS',
      appliedDate: new Date()
    },
    {
      id: 'c3',
      name: 'Emily Chen',
      email: 'emily.chen@tech.com',
      currentRole: 'Senior Engineer',
      experienceYears: 5,
      matchScore: 88,
      status: 'reviewed',
      skillsMatched: ['React', 'Redux', 'AWS'],
      skillsMissing: [],
      education: 'MS SE',
      appliedDate: new Date()
    }
  ];

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulate AI Response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I found ${dummyResults.length} candidates that match your criteria for "React Developer" within ${scope === 'all' ? 'the entire library' : 'the selected job'}.`,
        timestamp: new Date(),
        results: dummyResults
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background animate-in fade-in duration-500">
      
      {/* Header / Top Bar */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Talent Scout
          </h1>
          <p className="text-sm text-muted-foreground">
            Natural language search across your candidate pool
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex gap-4 max-w-4xl mx-auto",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
              msg.role === 'assistant' 
                ? "bg-primary/10 text-primary" 
                : "bg-secondary text-secondary-foreground"
            )}>
              {msg.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>

            {/* Message Content */}
            <div className={cn(
              "flex flex-col space-y-2 max-w-[80%]",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === 'assistant' 
                  ? "bg-card border text-card-foreground rounded-tl-none" 
                  : "bg-primary text-primary-foreground rounded-tr-none"
              )}>
                {msg.content}
              </div>

              {/* AI Results Cards */}
              {msg.results && (
                <div className="grid grid-cols-1 gap-3 w-full mt-2 animate-in fade-in slide-in-from-bottom-2">
                  {msg.results.map(candidate => (
                    <Card key={candidate.id} className="p-4 hover:shadow-md transition-shadow border-primary/20 bg-card/50">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                           <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                              {candidate.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="font-semibold text-foreground">{candidate.name}</h4>
                              <p className="text-xs text-muted-foreground">{candidate.currentRole} • {candidate.experienceYears}y Exp</p>
                              <div className="flex gap-1 mt-1.5">
                                 {candidate.skillsMatched.map(skill => (
                                    <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-secondary-foreground">{skill}</span>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className="text-sm font-bold text-green-600">{candidate.matchScore}% Match</span>
                           <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              View Profile <ArrowRight className="h-3 w-3" />
                           </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <div className="flex gap-2 mt-1">
                     <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-green-600">
                        <ThumbsUp className="h-3 w-3 mr-1" /> Helpful
                     </Button>
                     <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-red-600">
                        <ThumbsDown className="h-3 w-3 mr-1" /> Not helpful
                     </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t">
        <div className="max-w-4xl mx-auto space-y-4">
           {/* Scope Selector */}
           <div className="flex justify-center">
              <div className="inline-flex items-center rounded-full border bg-muted/30 px-3 py-1 text-sm">
                 <span className="text-muted-foreground mr-2 text-xs uppercase tracking-wider font-semibold">Searching In:</span>
                 <select 
                    className="bg-transparent border-none focus:ring-0 text-foreground text-sm font-medium cursor-pointer py-0 pl-0 pr-6"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    style={{ backgroundImage: 'none' }}
                 >
                    <option value="all">Entire CV Library</option>
                    <option value="job-1">Senior Frontend Engineer</option>
                    <option value="job-2">Product Manager</option>
                    <option value="job-3">UX Designer</option>
                 </select>
                 <ChevronDown className="h-3 w-3 ml-1 opacity-50 pointer-events-none -ml-4" />
              </div>
           </div>

           {/* Input Box */}
           <div className="relative flex items-end gap-2 bg-card border rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <textarea 
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="Ask anything... e.g., 'Find candidates with experience in Fintech'"
                 className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-sm"
                 rows={1}
              />
              <Button 
                 onClick={handleSend} 
                 disabled={!inputValue.trim()}
                 size="icon"
                 className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                 <Send className="h-4 w-4" />
              </Button>
           </div>
           <p className="text-center text-[10px] text-muted-foreground">
              AI can make mistakes. Verify important information.
           </p>
        </div>
      </div>

    </div>
  );
};

export default SearchPage;
