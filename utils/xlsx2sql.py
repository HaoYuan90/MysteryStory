# -*- coding: utf-8 -*-

from __future__ import print_function

import sys, re, codecs, locale, functools

# requires packages: mysql-python, openpyxl
import openpyxl as p
import MySQLdb

# Wrap sys.stdout into a StreamWriter to allow writing unicode.
sys.stdout = codecs.getwriter(locale.getpreferredencoding())(sys.stdout) 


# ugly but works
row_counts = {
    'script_characters': 4,
    'script_mcqs': 2,
    'script_mcq_options': 4,
    'script_lines': 12,
    'script_clues': 4,
    'script_stages': 4,
}

printe = functools.partial(print, file=sys.stderr)

def log(level, obj, s):
    msg = '(%s) %s %s\n' % (level, str(obj), s)
    sys.stderr.write(msg.encode('ascii', errors='replace'))

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

def process(in_filename, outfile):
    
    def emit(s):
        outfile.write(s)
        outfile.write('\n')
    
    emit('SET FOREIGN_KEY_CHECKS=0;')
    emit('SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";')
    
    wb = p.reader.excel.load_workbook(in_filename)
    #print(wb.get_sheet_names())
    
    char_by_initials = {}
    def hook_char(row):
        char_by_initials[row[2].value] = row[0].value
    
    s_chars = wb.get_sheet_by_name('script_characters')
    emit(format_sheet(s_chars, 'script_characters', hook_char))
    
    def hook_line(row):
        # define own logic for lower or upper (the library could not calculate from formula)
        #printe(row[6], row[6].value)
        if (row[6].value == 0):
            row[6].value = 'lower' if row[4].value in ('N', 'A') else 'upper'
        
        # change the initials to use character_id instead
        initial = row[4].value
        if initial in char_by_initials:
            row[4].value = char_by_initials[initial]
            if initial == 'N' and not unicode(row[5].value).startswith('<em>'):
                row[5].value = '<em>' + row[5].value + '</em>'
            return True
        else:
            log('W', row[4], u'Character initial "%s" is not recognised; ignoring row.' % row[4].value)
            return False
    
    for sheet_name in wb.get_sheet_names():
        sheet = wb.get_sheet_by_name(sheet_name)
        log('I', sheet, 'Processing...')
        if sheet_name == 'script_characters':
            pass # already processed
        elif sheet_name.startswith('script_'):
            emit(format_sheet(sheet, sheet_name))
        elif sheet_name.startswith('chapter'):
            emit(format_sheet(sheet, 'script_lines', hook_line))
        else:
            log('W', sheet, u'I have no idea what sheet "%s" is for...' % sheet_name)
    
    emit('SET FOREIGN_KEY_CHECKS=1;')
    

def format_sheet(sheet, table_name, hook_row=None):
    out = []
    for row in sheet.rows:
        # we only process the row if (1) the first column is a number and (2) the number of cells in the row is sufficient to fill the database and (3) either column 1 or 2 must exist
        if type(row[0].value) == int and len(row) >= row_counts[table_name] and (row[1].value or row[2].value):
            flag = True
            # chop off excesive columns
            row = row[:row_counts[table_name]]
            if hook_row:
                flag = hook_row(row)
            if flag in (True, None):
                out.append(u'REPLACE INTO %s VALUES (%s);\n' % (table_name, format_row(row)))
            
    return u''.join(out)

def format_row(row):
    return ', '.join(format_cell(c) for c in row)

def format_cell(c):
    if c.value is not None and unicode(c.value).lower() != 'null':
        return "'" + MySQLdb.escape_string(unicode(c.value).encode('ascii', errors='xmlcharrefreplace')) + "'"
    else:
        return 'NULL'

if __name__ == '__main__':
    process(sys.argv[1], sys.stdout)
