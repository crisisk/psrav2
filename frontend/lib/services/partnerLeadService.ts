interface Lead {
  id: string;
  name: string;
  email: string;
  status: 'lead' | 'customer';
  company: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  customerSince: Date;
}

export class PartnerLeadService {
  // Mock database for demonstration
  private leads: Lead[] = [
    {
      id: '65a7a8a9b0d8f8b8d8f8b8d',
      name: 'Example Lead',
      email: 'lead@example.com',
      status: 'lead',
      company: 'Example Corp'
    }
  ];

  async convertLeadToCustomer(leadId: string): Promise<{
    success: boolean;
    customer?: Customer;
    error?: string;
    statusCode?: number;
  }> {
    try {
      const lead = this.leads.find(l => l.id === leadId);

      if (!lead) {
        return { 
          success: false, 
          error: 'Lead not found',
          statusCode: 404
        };
      }

      if (lead.status === 'customer') {
        return {
          success: false,
          error: 'Lead is already a customer',
          statusCode: 400
        };
      }

      // Mock conversion logic
      const customer: Customer = {
        ...lead,
        customerSince: new Date(),
        status: 'customer'
      };

      // Update lead status in mock database
      this.leads = this.leads.map(l =>
        l.id === leadId ? { ...l, status: 'customer' } : l
      );

      return { success: true, customer };
    } catch (error) {
      console.error('Conversion error:', error);
      return {
        success: false,
        error: 'Failed to convert lead',
        statusCode: 500
      };
    }
  }
}
