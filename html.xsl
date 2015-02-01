<?xml version="1.0"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:variable name="brand" select="/content/@title"/>
    <xsl:template name="page">
        <xsl:param name="title"/>

<meta name="viewport" content="width=device-width, initial-scale=1" />
<html lang="en">
<head>
<title><xsl:value-of select="concat($brand, ' - ', $title)"/></title>
<script src="http://code.jquery.com/jquery-2.1.1.min.js"></script>

<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap-theme.min.css" />
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" />

<link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/codemirror/4.8.0/codemirror.min.css" />
<script src="http://cdnjs.cloudflare.com/ajax/libs/codemirror/4.8.0/codemirror.js"></script>
<script src="http://cdnjs.cloudflare.com/ajax/libs/codemirror/4.8.0/mode/scheme/scheme.min.js"></script>

<script src="jsLisp.js"></script>
<script src="editor.js"></script>

    <style>
        .CodeMirror {
            background: #e0e0e0;
            border: 1px solid black;
        }

        pre.output {
            font-style: italic;
        }

        #editorOutput {
            resize: none;
        }
    </style>
</head>
<body>


<div class="container">

<nav class="navbar navbar-default">
  <div class="navbar-header">
    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#top-bar">
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
    </button>
    <span class="navbar-brand"><xsl:value-of select="$brand"/></span>
  </div>
  
  <div class="collapse navbar-collapse" id="top-bar">
    <form class="navbar-form navbar-right">
      <button id="launchEditor" type="button" class="btn btn-default">Launch Editor</button>
    </form>
  </div>
</nav>

<h1><xsl:value-of select="$title"/></h1>

<xsl:apply-templates select="*"/>

<button id="tryItButton" class="hidden btn btn-info btn-xs pull-right">Try it</button>

<div id="editorModal" class="modal fade" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"><xsl:text disable-output-escaping="yes"><![CDATA[&times;]]></xsl:text></span></button>
                <h4 class="modal-title">Scheme Interpreter</h4>
            </div>
            <div class="modal-body">
                <label for="editorInput">Input</label>
                <textarea id="editorInput" class="form-control"></textarea>
            </div>
            <div class="modal-body">
                <label for="editorOutput">Output</label>
                <textarea id="editorOutput" class="form-control"></textarea>
            </div>
            <div class="modal-footer">
                <button id="editorExecute" type="button" class="btn btn-primary">Evaluate</button>
                <button id="editorDismiss" type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

</div>
</body>
</html>

    </xsl:template>

    <xsl:template match="text()"><xsl:copy-of select="."/></xsl:template>
    <xsl:template match="lead">
        <p class="lead"><xsl:apply-templates select="node()"/></p>
    </xsl:template>
    <xsl:template match="p">
        <p><xsl:apply-templates select="node()"/></p>
    </xsl:template>
    <xsl:template match="term">
        <strong><xsl:value-of select="text()"/></strong>
    </xsl:template>
    <xsl:template match="code">
        <pre><xsl:copy-of select="text()"/></pre>
    </xsl:template>
    <xsl:template match="result">
        <blockquote><xsl:copy-of select="text()"/></blockquote>
    </xsl:template>
    <xsl:template match="section">
        <h2><xsl:value-of select="@title"/></h2>
        <xsl:apply-templates select="*"/>
    </xsl:template>

    <xsl:template match="/content/page">
        <xsl:result-document method="html" doctype-public="html" href="{concat(substring(translate(translate(@title, translate(@title, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', ''), '-'), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 1, 20), '.html')}">
            <xsl:call-template name="page">
                <xsl:with-param name="title" select="@title"/>
            </xsl:call-template>
        </xsl:result-document>
    </xsl:template>
</xsl:stylesheet>
