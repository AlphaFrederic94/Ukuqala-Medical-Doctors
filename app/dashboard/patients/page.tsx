import { Search, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"

export default function PatientsPage() {
  return (
    <div className="flex flex-col">
      <Header title="My Patients" />

      <div className="p-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search patients by name, ID, or email..." className="pl-10 bg-card border-border" />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <Card className="border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">2</p>
            <p className="text-sm text-muted-foreground">Total Patients</p>
          </Card>
          <Card className="border border-border bg-card p-4">
            <p className="text-2xl font-bold text-primary">1</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </Card>
          <Card className="border border-border bg-card p-4">
            <p className="text-2xl font-bold text-blue-500">1</p>
            <p className="text-sm text-muted-foreground">New This Month</p>
          </Card>
          <Card className="border border-border bg-card p-4">
            <p className="text-2xl font-bold text-orange-500">0</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </Card>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {/* Sample Patient Card 1 */}
          <Card className="border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
                  <span className="text-xl font-semibold text-blue-500">SA</span>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">Sarah Anderson</h3>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20">Active</Badge>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">Patient ID: #PAT-001</p>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>sarah.a@email.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>+1 234-567-8900</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>New York, NY</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-border bg-transparent">
                  View History
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  View Profile
                </Button>
              </div>
            </div>
          </Card>

          {/* Sample Patient Card 2 */}
          <Card className="border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
                  <span className="text-xl font-semibold text-purple-500">MJ</span>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">Michael Johnson</h3>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20">Active</Badge>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">Patient ID: #PAT-002</p>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>michael.j@email.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>+1 234-567-8901</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Los Angeles, CA</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-border bg-transparent">
                  View History
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  View Profile
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
