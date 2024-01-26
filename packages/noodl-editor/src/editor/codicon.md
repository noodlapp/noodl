Font used by Monaco Editor for the icons.

The issue:

Monaco Editor is importing the font with CSS url.
`url('./codicon.ttf')` and since we don't transform the urls because
of the old templates this causes a problem here.

Easy solution was just to move this single font file here and everything works fine.
