from celery import shared_task
from django.utils import timezone
from datetime import timedelta

@shared_task(name='tickets.tasks.receive_ticket')
def push_ticket_to_workflow(ticket_data):
    # This will be picked up and executed by `workflow_api`
    pass

@shared_task(name='send_ticket_status')
def update_ticket_status_from_queue(ticket_number, new_status):
    from .models import Ticket
    try:
        ticket = Ticket.objects.get(ticket_number=ticket_number)
        ticket.status = new_status
        ticket.save()
        print(f"Ticket with ticket_number {ticket_number} status updated to {new_status}")
    except Ticket.DoesNotExist:
        print(f"Ticket with ticket_number {ticket_number} does not exist")

@shared_task(name='auto_close_resolved_tickets')
def auto_close_resolved_tickets():
    """
    Automatically close tickets that have been in 'Resolved' status for 72 hours or more.
    Sets date_completed but does NOT set csat_rating or feedback (only manual close does that).
    """
    from .models import Ticket, TicketComment
    
    # Calculate the cutoff time (72 hours ago)
    cutoff_time = timezone.now() - timedelta(hours=72)
    
    # Find all tickets that are Resolved and have been updated more than 72 hours ago
    resolved_tickets = Ticket.objects.filter(
        status='Resolved',
        update_date__lte=cutoff_time
    )
    
    closed_count = 0
    for ticket in resolved_tickets:
        try:
            ticket.status = 'Closed'
            ticket.time_closed = timezone.now()
            ticket.date_completed = timezone.now()
            
            # Calculate resolution time if not already set
            if ticket.submit_date and not ticket.resolution_time:
                ticket.resolution_time = timezone.now() - ticket.submit_date
            
            ticket.save()
            
            # Add a comment noting the auto-closure
            TicketComment.objects.create(
                ticket=ticket,
                user=None,
                comment="Ticket automatically closed after 72 hours in Resolved status.",
                is_internal=False
            )
            
            closed_count += 1
            print(f"Auto-closed ticket {ticket.ticket_number}")
            
        except Exception as e:
            print(f"Error auto-closing ticket {ticket.ticket_number}: {e}")
            continue
    
    return f"Auto-closed {closed_count} tickets"