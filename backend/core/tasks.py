from celery import shared_task

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