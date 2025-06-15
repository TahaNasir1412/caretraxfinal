"use client"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, HelpCircle, LogOut, Phone, Send } from "lucide-react"
import PatientNavigation from "@/components/patient/navigation"

// Import the useRouter hook at the top of the file
import { useRouter } from "next/navigation"

interface Message {
  id: string
  sender: "user" | "support"
  content: string
  timestamp: string
  read: boolean
}

interface FAQ {
  id: string
  question: string
  answer: string
}

export default function PatientSupport() {
  // Add the router declaration near the top of the component function
  const router = useRouter()
  const [activeChat, setActiveChat] = useState(true)
  const [newMessage, setNewMessage] = useState("")

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-001",
      sender: "support",
      content: "Hello! How can I help you today?",
      timestamp: "10:30 AM",
      read: true,
    },
    {
      id: "m-002",
      sender: "user",
      content: "I have a question about my insulin drip schedule.",
      timestamp: "10:32 AM",
      read: true,
    },
    {
      id: "m-003",
      sender: "support",
      content: "Of course! What would you like to know about your schedule?",
      timestamp: "10:33 AM",
      read: true,
    },
    {
      id: "m-004",
      sender: "user",
      content: "Can I request a change to my morning insulin drip time?",
      timestamp: "10:35 AM",
      read: true,
    },
    {
      id: "m-005",
      sender: "support",
      content: "Yes, we can certainly look into adjusting your morning schedule. What time would work better for you?",
      timestamp: "10:36 AM",
      read: true,
    },
  ])

  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: "faq-001",
      question: "How do I monitor my insulin drip levels?",
      answer:
        "You can monitor your insulin drip levels in real-time through the CareTrax app. On your dashboard, you'll see a percentage indicator showing how much insulin remains in your current drip. The app will also notify you when levels are running low.",
    },
    {
      id: "faq-002",
      question: "What do I do if I notice my drip is running low?",
      answer:
        "If you notice your drip is running low, don't worry - the nursing staff is automatically notified. However, you can also use the 'Request Assistance' button on your dashboard or contact the nursing station directly using the Support tab.",
    },
    {
      id: "faq-003",
      question: "How often are insulin drips typically replaced?",
      answer:
        "Insulin drips are typically replaced every 8 hours or when they reach a critical level (below 10%). Your specific schedule may vary based on your treatment plan, which you can view in the History tab.",
    },
    {
      id: "faq-004",
      question: "Can I see a history of my insulin treatments?",
      answer:
        "Yes, you can view your complete treatment history in the History tab. This includes all past insulin drips, their start and end times, and which healthcare provider administered them.",
    },
    {
      id: "faq-005",
      question: "How do I understand my billing statement?",
      answer:
        "Your billing statement in the Billing tab breaks down all charges related to your treatment. Each insulin drip administration is itemized with its date and cost. If you have questions about specific charges, you can contact our billing department through the Support tab.",
    },
  ])

  const sendMessage = () => {
    if (newMessage.trim() === "") return

    const newMsg: Message = {
      id: `m-${messages.length + 1}`,
      sender: "user",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    }

    setMessages([...messages, newMsg])
    setNewMessage("")

    // Simulate response
    setTimeout(() => {
      const responseMsg: Message = {
        id: `m-${messages.length + 2}`,
        sender: "support",
        content: "Thank you for your message. A support representative will respond shortly.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: false,
      }

      setMessages((prev) => [...prev, responseMsg])
    }, 1000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4">
          <Link href="/patient/dashboard" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Support & Help</h1>
          <div className="ml-auto">
            <Button variant="primary" size="sm" onClick={() => router.push("/")}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="chat">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <Card className="h-[calc(100vh-240px)] flex flex-col">
              <CardHeader className="px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback>CS</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">CareTrax Support</CardTitle>
                    <p className="text-xs text-muted-foreground">{activeChat ? "Online" : "Offline"}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
              </CardContent>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    className="min-h-[40px] resize-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button size="icon" onClick={sendMessage} disabled={newMessage.trim() === ""}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="faqs" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
            </div>

            {faqs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden">
                <CardHeader className="p-4 bg-muted/50">
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Contact Information</h2>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Nursing Station</h3>
                    <p className="text-sm text-muted-foreground">For immediate assistance with your treatment</p>
                    <Button variant="link" className="px-0 text-primary">
                      +1 (555) 123-4567
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-medium mb-1">Billing Department</h3>
                    <p className="text-sm text-muted-foreground">For questions about your invoice or payments</p>
                    <Button variant="link" className="px-0 text-primary">
                      +1 (555) 987-6543
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-medium mb-1">Technical Support</h3>
                    <p className="text-sm text-muted-foreground">For help with the CareTrax app</p>
                    <Button variant="link" className="px-0 text-primary">
                      +1 (555) 456-7890
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input id="name" placeholder="Your name" />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="Your email" />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input id="subject" placeholder="Message subject" />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea id="message" placeholder="Your message" rows={4} />
                </div>

                <Button className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <PatientNavigation />
    </div>
  )
}
