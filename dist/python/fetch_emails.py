# import required module
import os, re, email, csv
from email import policy
from email.parser import BytesParser

in_dir = 'emails'
out_dir = 'emails.csv'
csv_header = ['Sender', 'Subject', 'Content', 'Date']

def set_csv_header(out_dir, header):
    with open(out_dir, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(header)

def append_to_csv(file_path, data):
    with open(file_path, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(data)

def get_email_content(part):
    if part.is_multipart(): # if multipart, iterate over subparts
        content = ""
        for subpart in part.iter_parts():
            content += get_email_content(subpart)
    else:
        payload = part.get_payload(decode=True)
        charset = part.get_content_charset()
        if charset: content = payload.decode(charset)
        else: content = payload
    return content

def parse_email(file_path):
    try:
        with open(file_path, 'rb') as f:
            msg = BytesParser(policy=policy.default).parse(f)
            
            # Extract basic information
            sender = msg.get('from', '')
            subject = msg.get('subject', '')
            date = msg.get('date', '')
            content = get_email_content(msg)
            email = [sender, subject, content, date]
            append_to_csv(out_dir, email)
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")


###### main #######
i = 1
cap = 50
set_csv_header(out_dir, csv_header)
for filename in os.listdir(in_dir):
    f = os.path.join(in_dir, filename)
    if os.path.isfile(f):
        parse_email(f)
    i+=1
    if i >= cap: break
