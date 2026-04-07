import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension, Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

const btn = { background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500, boxShadow: "0 2px 4px rgba(30, 58, 138, 0.3)" };
const btnSecondary = { ...btn, background: "#64748b", boxShadow: "none" };
const btnSuccess = { ...btn, background: "#16a34a", boxShadow: "none" };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "24px" };
const formGroup = { display: "flex", flexDirection: "column" };
const label = { fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "8px" };
const inputBase = { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" };

const mmToPx = (mm) => mm * 3.7795275591;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const buildPlaceholderImage = (labelText, color) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="140" viewBox="0 0 480 140"><rect width="480" height="140" rx="20" fill="${color}"/><text x="240" y="78" text-anchor="middle" font-size="28" font-family="Arial, sans-serif" fill="#ffffff">${labelText}</text></svg>`)}`;
const normalizeSettings = (source = {}) => ({ ...source, templates: Array.isArray(source.templates) ? source.templates : [] });

const templateFieldOptions = [
  { key: "order_number", label: "Užsakymo numeris" },
  { key: "today_date", label: "Šiandienos data" },
  { key: "client_name", label: "Klientas" },
  { key: "carrier_name", label: "Vežėjas" },
  { key: "cargo", label: "Krovinys" },
  { key: "route", label: "Maršrutas" },
  { key: "loading_date", label: "Pakrovimo data" },
  { key: "unloading_date", label: "Iškrovimo data" },
  { key: "client_price", label: "Kliento kaina" },
  { key: "carrier_price", label: "Vežėjo kaina" },
  { key: "payment_term", label: "Mokėjimo terminas" },
  { key: "company_logo", label: "Logotipas" },
  { key: "company_stamp_signature", label: "Antspaudas / parašas" }
];

const buildPreviewFields = (settings, manualState) => ({
  order_number: "RAD-2026-014",
  today_date: "2026-04-05",
  client_name: "MB Radanaras",
  carrier_name: "UAB Baltic Carrier",
  cargo: "Automobilių pervežimas",
  route: "Hamburg, DE → Vilnius, LT",
  loading_date: "2026-04-07",
  unloading_date: "2026-04-09",
  client_price: "1450.00 EUR",
  carrier_price: "1180.00 EUR",
  payment_term: "14 dienų",
  company_logo: manualState?.assets?.logoSrc || settings?.company?.logo_url || buildPlaceholderImage("LOGO", "#2563eb"),
  company_stamp_signature: settings?.companyStampSignature || buildPlaceholderImage("STAMP", "#0f766e")
});

const renderTemplateTokens = (html, values) =>
  String(html || "").replace(/{{\s*([^}]+)\s*}}/g, (_, token) => values[token.trim()] ?? `{{${token.trim()}}}`);

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element) => element.style.fontSize || null,
          renderHTML: (attributes) => (attributes.fontSize ? { style: `font-size:${attributes.fontSize}` } : {})
        }
      }
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run()
    };
  }
});

const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  parseHTML() {
    return [{ tag: "div[data-page-break='true']" }];
  },
  renderHTML() {
    return ["div", { "data-page-break": "true", style: "page-break-before:always; border-top:2px dashed #cbd5e1; color:#64748b; text-align:center; font-size:12px; padding:10px 0; margin:20px 0;" }, "Puslapio lūžis"];
  },
  addCommands() {
    return {
      setPageBreak: () => ({ commands }) => commands.insertContent({ type: this.name })
    };
  }
});

const TemplateImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 240,
        parseHTML: (element) => Number(element.getAttribute("data-width") || element.style.width.replace("px", "")) || 240,
        renderHTML: (attributes) => ({ "data-width": attributes.width })
      },
      align: {
        default: "left",
        parseHTML: (element) => element.getAttribute("data-align") || "left",
        renderHTML: (attributes) => ({ "data-align": attributes.align || "left" })
      },
      role: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-asset-role") || null,
        renderHTML: (attributes) => (attributes.role ? { "data-asset-role": attributes.role } : {})
      }
    };
  },
  renderHTML({ HTMLAttributes }) {
    const width = Number(HTMLAttributes.width) || 240;
    const align = HTMLAttributes.align || "left";
    const margin = align === "center" ? "14px auto" : align === "right" ? "14px 0 14px auto" : "14px auto 14px 0";
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      style: [HTMLAttributes.style, `width:${width}px`, "max-width:100%", "height:auto", "display:block", `margin:${margin}`, "object-fit:contain"].filter(Boolean).join("; ")
    })];
  },
  addCommands() {
    return {
      setTemplateImage: (attributes) => ({ commands }) => commands.insertContent({ type: this.name, attrs: { width: 240, align: "left", ...attributes } }),
      updateSelectedTemplateImage: (attributes) => ({ state, dispatch }) => {
        const imageType = this.type;
        let position = null;
        let node = null;
        if (state.selection.node?.type === imageType) {
          position = state.selection.from;
          node = state.selection.node;
        } else {
          state.doc.nodesBetween(state.selection.from, state.selection.to, (currentNode, pos) => {
            if (currentNode.type === imageType) {
              position = pos;
              node = currentNode;
              return false;
            }
            return undefined;
          });
        }
        if (position === null || !node) return false;
        if (dispatch) dispatch(state.tr.setNodeMarkup(position, undefined, { ...node.attrs, ...attributes }));
        return true;
      }
    };
  }
});

const defaultDocumentHtml = () => `
  <div style="padding:22px 24px; border:1px solid #dbeafe; border-radius:22px; background:linear-gradient(180deg,#fbfdff,#eef5ff); margin-bottom:18px;">
    <table style="width:100%; border-collapse:collapse;">
      <tr>
        <td style="width:58%; vertical-align:top; padding-right:16px;">
          <img src="${buildPlaceholderImage("LOGO", "#2563eb")}" alt="Logo" data-asset-role="logo" data-align="left" data-width="220" style="width:220px; max-width:100%; height:auto; display:block; margin:0 auto 18px 0;" />
          <div style="font-size:30px; line-height:1.05; font-weight:800; color:#0f172a; letter-spacing:-0.03em;">Transporto užsakymas</div>
          <div style="font-size:14px; color:#475569; margin-top:8px;">Dokumento juodraštis su dinaminiais laukais, kainomis ir sąlygomis.</div>
        </td>
        <td style="width:42%; vertical-align:top;">
          <div style="padding:18px; background:#0f172a; color:#ffffff; border-radius:18px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.14em; opacity:0.72; margin-bottom:10px;">Order summary</div>
            <div style="font-size:24px; font-weight:800; margin-bottom:8px;">{{order_number}}</div>
            <div style="display:grid; gap:8px; font-size:13px; color:rgba(255,255,255,0.88);">
              <div><strong style="color:#ffffff;">Data:</strong> {{today_date}}</div>
              <div><strong style="color:#ffffff;">Mokėjimas:</strong> {{payment_term}}</div>
              <div><strong style="color:#ffffff;">Vežėjas:</strong> {{carrier_name}}</div>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
  <div style="padding:18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:18px; margin-bottom:16px;">
    <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin-bottom:8px;">Užsakymo santrauka</div>
    <div style="font-size:14px; color:#0f172a; line-height:1.8;">Tarp <strong>{{client_name}}</strong> ir <strong>{{carrier_name}}</strong> sudaromas transporto užsakymas dėl krovinio <strong>{{cargo}}</strong> maršrutu <strong>{{route}}</strong>.</div>
  </div>
  <table style="width:100%; border-collapse:collapse; margin:0 0 18px 0;">
    <tr>
      <td style="width:60%; vertical-align:top; padding-right:14px;">
        <div style="padding:18px; border:1px solid #dbeafe; border-radius:18px; background:#ffffff;">
          <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin-bottom:12px;">Pagrindinė informacija</div>
          <p><strong>Krovinys:</strong> {{cargo}}</p>
          <p><strong>Maršrutas:</strong> {{route}}</p>
          <p><strong>Pakrovimas:</strong> {{loading_date}}</p>
          <p><strong>Iškrovimas:</strong> {{unloading_date}}</p>
        </div>
      </td>
      <td style="width:40%; vertical-align:top;">
        <div style="padding:18px; border:1px solid #e2e8f0; border-radius:18px; background:#ffffff;">
          <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin-bottom:12px;">Finansai</div>
          <p><strong>Kliento kaina:</strong> {{client_price}}</p>
          <p><strong>Vežėjo kaina:</strong> {{carrier_price}}</p>
          <p><strong>Mokėjimo terminas:</strong> {{payment_term}}</p>
        </div>
      </td>
    </tr>
  </table>
  <div data-page-break="true"></div>
  <h2>Sąlygos ir atsakomybės</h2>
  <p>Vežėjas atsako už krovinio saugumą nuo pakrovimo iki iškrovimo ir užtikrina tinkamą transporto priemonės būklę.</p>
  <p>Užsakovas apmoka paslaugas pagal suderintą kainą ir nustatytą mokėjimo terminą.</p>
`;

const defaultManualTemplateState = () => ({
  templateId: null,
  name: "Modernus transporto orderis",
  documentHtml: defaultDocumentHtml(),
  layout: {
    orientation: "portrait",
    marginTop: 14,
    marginRight: 14,
    marginBottom: 14,
    marginLeft: 14,
    pageGap: 20,
    zoom: 70
  },
  assets: {
    logoSrc: "",
    logoWidth: 220,
    logoAlign: "left"
  }
});

const extractLegacyDocumentHtml = (template, defaults, previewFields) => {
  const manual = template?.editorState?.manual;
  if (manual?.documentHtml) return manual.documentHtml;
  if (manual?.headerHtml || manual?.bodyHtml || manual?.footerHtml) {
    return `<div>${manual.headerHtml || ""}${manual.bodyHtml || defaults.documentHtml}${manual.footerHtml || ""}</div>`;
  }
  const rawContent = String(template?.content || "").trim();
  if (!rawContent) return defaults.documentHtml;
  const doc = new DOMParser().parseFromString(rawContent, "text/html");
  const root = doc.body.querySelector("[data-template-root] > div");
  const inner = root ? root.innerHTML : rawContent;
  return inner
    .replace(/{{\s*company_logo\s*}}/g, previewFields.company_logo)
    .replace(/{{\s*company_stamp_signature\s*}}/g, previewFields.company_stamp_signature);
};

const prepareDocumentHtml = (html, manualState, previewFields) => {
  const source = String(html || "")
    .replace(/{{\s*company_logo\s*}}/g, previewFields.company_logo)
    .replace(/{{\s*company_stamp_signature\s*}}/g, previewFields.company_stamp_signature);
  const doc = new DOMParser().parseFromString(`<div>${source}</div>`, "text/html");
  const root = doc.body.firstChild;
  if (!root) return source;

  root.querySelectorAll("img").forEach((node) => {
    const role = node.getAttribute("data-asset-role");
    if (role === "logo") {
      const align = manualState.assets.logoAlign || "left";
      const width = Number(manualState.assets.logoWidth) || 220;
      node.setAttribute("src", manualState.assets.logoSrc || previewFields.company_logo);
      node.setAttribute("data-align", align);
      node.setAttribute("data-width", String(width));
      node.style.width = `${width}px`;
      node.style.maxWidth = "100%";
      node.style.height = "auto";
      node.style.objectFit = "contain";
      node.style.display = "block";
      node.style.margin = align === "center" ? "14px auto" : align === "right" ? "14px 0 14px auto" : "14px auto 14px 0";
    }
    if (role === "stamp") {
      node.setAttribute("src", previewFields.company_stamp_signature);
      node.style.maxHeight = node.style.maxHeight || "92px";
      node.style.maxWidth = node.style.maxWidth || "180px";
      node.style.objectFit = "contain";
    }
  });

  return root.innerHTML;
};

const buildTemplateMarkup = (state, previewFields) => {
  const padding = `${state.layout.marginTop}mm ${state.layout.marginRight}mm ${state.layout.marginBottom}mm ${state.layout.marginLeft}mm`;
  const content = prepareDocumentHtml(state.documentHtml, state, previewFields);
  return `
    <div data-template-root="manual-order-template" data-orientation="${state.layout.orientation}" style="font-family:Arial, Helvetica, sans-serif; color:#0f172a; width:100%; background:#ffffff;">
      <div style="padding:${padding}; box-sizing:border-box;">
        ${content}
      </div>
    </div>
  `;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function TemplateManager({ settings, saveSettings }) {
  const [manualState, setManualState] = useState(() => defaultManualTemplateState());
  const [mode, setMode] = useState("manual");
  const [previewPages, setPreviewPages] = useState([""]);
  const [textColor, setTextColor] = useState("#0f172a");
  const [fontSize, setFontSize] = useState("16px");
  const templates = useMemo(() => normalizeSettings(settings).templates, [settings]);
  const imageInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const measureRef = useRef(null);
  const previewViewportRef = useRef(null);
  const previewFields = useMemo(() => buildPreviewFields(settings, manualState), [settings, manualState]);
  const preparedDocument = useMemo(() => prepareDocumentHtml(manualState.documentHtml, manualState, previewFields), [manualState, previewFields]);
  const renderedDocument = useMemo(() => renderTemplateTokens(preparedDocument, previewFields), [preparedDocument, previewFields]);
  const pageSize = manualState.layout.orientation === "portrait" ? { width: 794, height: 1123 } : { width: 1123, height: 794 };
  const previewScale = Math.max(0.25, manualState.layout.zoom / 100);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      PageBreak,
      TemplateImage,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell
    ],
    content: preparedDocument,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "manual-template-editor",
        style: "min-height:900px; outline:none; font-family:Arial, Helvetica, sans-serif; color:#0f172a"
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      setManualState((prev) => (prev.documentHtml === html ? prev : { ...prev, documentHtml: html }));
    }
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== preparedDocument) {
      editor.commands.setContent(preparedDocument, false);
    }
  }, [editor, preparedDocument]);

  useEffect(() => {
    const measureRoot = measureRef.current;
    if (!measureRoot) return;

    const contentWidth = pageSize.width - mmToPx(manualState.layout.marginLeft + manualState.layout.marginRight);
    const contentHeight = pageSize.height - mmToPx(manualState.layout.marginTop + manualState.layout.marginBottom);
    const sourceDoc = new DOMParser().parseFromString(`<div>${renderedDocument || "<p></p>"}</div>`, "text/html");
    const sourceNodes = Array.from(sourceDoc.body.firstChild?.childNodes || []).filter(
      (node) => node.nodeType === 1 || String(node.textContent || "").trim()
    );

    const host = document.createElement("div");
    host.style.position = "absolute";
    host.style.left = "-99999px";
    host.style.top = "0";
    host.style.visibility = "hidden";
    host.style.width = `${contentWidth}px`;
    measureRoot.innerHTML = "";
    measureRoot.appendChild(host);

    const pages = [];
    let page = document.createElement("div");
    page.style.width = "100%";
    page.style.boxSizing = "border-box";
    host.appendChild(page);

    const pushPage = () => {
      pages.push(page.innerHTML || `<div style="color:#94a3b8; font-size:13px;">Tuščias puslapis</div>`);
      page = document.createElement("div");
      page.style.width = "100%";
      page.style.boxSizing = "border-box";
      host.appendChild(page);
    };

    if (!sourceNodes.length) {
      setPreviewPages([`<div style="color:#94a3b8; font-size:13px;">Pradėkite kurti šabloną.</div>`]);
      measureRoot.innerHTML = "";
      return;
    }

    sourceNodes.forEach((node) => {
      const clone = node.cloneNode(true);
      if (clone.nodeType === 1 && clone.getAttribute("data-page-break") === "true") {
        pushPage();
        return;
      }
      page.appendChild(clone);
      if (page.scrollHeight > contentHeight && page.childNodes.length > 1) {
        page.removeChild(clone);
        pushPage();
        page.appendChild(clone);
      }
    });

    if (page.innerHTML.trim()) pages.push(page.innerHTML);
    setPreviewPages(pages.length ? pages : [""]);
    measureRoot.innerHTML = "";
  }, [manualState.layout.marginBottom, manualState.layout.marginLeft, manualState.layout.marginRight, manualState.layout.marginTop, pageSize.height, pageSize.width, renderedDocument]);

  const updateLogoSetting = (key, value) => {
    setManualState((prev) => ({ ...prev, assets: { ...prev.assets, [key]: value } }));
  };

  const insertField = (key) => {
    if (!editor) return;
    if (key === "company_logo") {
      editor.chain().focus().setTemplateImage({
        src: manualState.assets.logoSrc || previewFields.company_logo,
        alt: "Logo",
        width: manualState.assets.logoWidth,
        align: manualState.assets.logoAlign,
        role: "logo"
      }).run();
      return;
    }
    if (key === "company_stamp_signature") {
      editor.chain().focus().setTemplateImage({
        src: previewFields.company_stamp_signature,
        alt: "Stamp",
        width: 180,
        align: "right",
        role: "stamp"
      }).run();
      return;
    }
    editor.chain().focus().insertContent(`{{${key}}}`).run();
  };

  const insertTemplateBlock = (variant) => {
    if (!editor) return;
    if (variant === "infoTable") {
      editor.chain().focus().insertContent(`
        <table style="width:100%; border-collapse:collapse; margin:12px 0;">
          <tr><th style="border:1px solid #1e293b; padding:8px; background:#f8fafc;">Laukas</th><th style="border:1px solid #1e293b; padding:8px; background:#f8fafc;">Reikšmė</th></tr>
          <tr><td style="border:1px solid #1e293b; padding:8px;">Maršrutas</td><td style="border:1px solid #1e293b; padding:8px;">{{route}}</td></tr>
          <tr><td style="border:1px solid #1e293b; padding:8px;">Krovinys</td><td style="border:1px solid #1e293b; padding:8px;">{{cargo}}</td></tr>
        </table>
      `).run();
      return;
    }
    if (variant === "priceTable") {
      editor.chain().focus().insertContent(`
        <table style="width:100%; border-collapse:collapse; margin:12px 0;">
          <tr><th style="border:1px solid #1e293b; padding:8px; background:#eff6ff;">Pozicija</th><th style="border:1px solid #1e293b; padding:8px; background:#eff6ff;">Suma</th></tr>
          <tr><td style="border:1px solid #1e293b; padding:8px;">Kliento kaina</td><td style="border:1px solid #1e293b; padding:8px;">{{client_price}}</td></tr>
          <tr><td style="border:1px solid #1e293b; padding:8px;">Vežėjo kaina</td><td style="border:1px solid #1e293b; padding:8px;">{{carrier_price}}</td></tr>
        </table>
      `).run();
      return;
    }
    editor.chain().focus().setPageBreak().run();
  };

  const handleInlineImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    const dataUrl = await readFileAsDataUrl(file);
    editor.chain().focus().setTemplateImage({ src: dataUrl, alt: file.name, width: 240, align: "left" }).run();
    event.target.value = "";
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    const dataUrl = await readFileAsDataUrl(file);
    setManualState((prev) => ({ ...prev, assets: { ...prev.assets, logoSrc: dataUrl } }));
    editor.chain().focus().setTemplateImage({
      src: dataUrl,
      alt: "Logo",
      width: manualState.assets.logoWidth,
      align: manualState.assets.logoAlign,
      role: "logo"
    }).run();
    event.target.value = "";
  };

  const saveTemplate = () => {
    const nextSettings = normalizeSettings(settings);
    const now = new Date().toISOString();
    const templateId = manualState.templateId || Date.now();
    const nextTemplate = {
      id: templateId,
      name: manualState.name || "Šablonas",
      content: buildTemplateMarkup(manualState, previewFields),
      createdAt: templates.find((template) => template.id === templateId)?.createdAt || now,
      updatedAt: now,
      editorState: {
        manual: {
          name: manualState.name,
          documentHtml: manualState.documentHtml,
          layout: manualState.layout,
          assets: manualState.assets
        }
      }
    };
    const nextTemplates = [...templates];
    const existingIndex = nextTemplates.findIndex((template) => template.id === templateId);
    if (existingIndex >= 0) nextTemplates[existingIndex] = { ...nextTemplates[existingIndex], ...nextTemplate };
    else nextTemplates.unshift(nextTemplate);
    saveSettings({ ...nextSettings, templates: nextTemplates });
    setManualState((prev) => ({ ...prev, templateId }));
    window.alert(existingIndex >= 0 ? "Šablonas atnaujintas." : "Šablonas išsaugotas.");
  };

  const loadTemplate = (template) => {
    const defaults = defaultManualTemplateState();
    const restored = {
      ...defaults,
      ...(template?.editorState?.manual || {}),
      templateId: template?.id ?? null,
      name: template?.name || defaults.name,
      layout: { ...defaults.layout, ...(template?.editorState?.manual?.layout || {}) },
      assets: { ...defaults.assets, ...(template?.editorState?.manual?.assets || {}) }
    };
    restored.documentHtml = extractLegacyDocumentHtml(template, defaults, previewFields);
    setManualState(restored);
    setMode("manual");
  };

  const createNewTemplate = () => {
    setManualState(defaultManualTemplateState());
    setMode("manual");
  };

  const zoomIn = () => setManualState((prev) => ({ ...prev, layout: { ...prev.layout, zoom: clamp(prev.layout.zoom + 10, 30, 160) } }));
  const zoomOut = () => setManualState((prev) => ({ ...prev, layout: { ...prev.layout, zoom: clamp(prev.layout.zoom - 10, 30, 160) } }));
  const fitPreview = () => {
    const viewport = previewViewportRef.current;
    if (!viewport) return;
    const nextZoom = clamp(Math.floor(((viewport.clientWidth - 40) / pageSize.width) * 100), 30, 120);
    setManualState((prev) => ({ ...prev, layout: { ...prev.layout, zoom: nextZoom } }));
  };

  return (
    <div>
      <h3 style={{ marginBottom: "16px", color: "#1e3a8a" }}>📝 Užsakymų šablonai</h3>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button type="button" style={mode === "manual" ? btn : btnSecondary} onClick={() => setMode("manual")}>
          🛠 Manual tools
        </button>
        <button type="button" style={mode === "ai" ? btn : btnSecondary} onClick={() => setMode("ai")}>
          ✨ AI generation
        </button>
      </div>

      {mode === "manual" && (
        <>
          <div style={{ marginBottom: "20px", padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e3a8a", marginBottom: "6px" }}>Tiptap rankinis redaktorius</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Dabartinis Manual tools režimas naudoja realų Tiptap dokumentų redaktorių vietoje `contentEditable` įrankių.
            </div>
          </div>

          <div style={{ ...formGrid, gridTemplateColumns: "minmax(420px, 1.25fr) minmax(360px, 0.75fr)", alignItems: "start" }}>
            <div style={{ display: "grid", gap: "18px" }}>
              <div style={{ padding: "18px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                <div style={{ ...formGrid, gridTemplateColumns: "1.2fr 0.8fr", marginBottom: 0 }}>
                  <div style={formGroup}>
                    <label style={label}>Šablono pavadinimas</label>
                    <input
                      style={inputBase}
                      value={manualState.name}
                      onChange={(e) => setManualState((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="pvz. Profesionalus vežėjo orderis"
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "end", gap: "10px", flexWrap: "wrap" }}>
                    <button type="button" style={btnSecondary} onClick={createNewTemplate}>Naujas</button>
                    <button type="button" style={btnSuccess} onClick={saveTemplate}>💾 Išsaugoti</button>
                  </div>
                </div>
              </div>

              <div style={{ padding: "18px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a" }}>Tiptap įrankiai</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Spalvos, antraštės, sąrašai, lentelės, paveikslai</div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <select style={{ ...inputBase, width: "auto" }} defaultValue="paragraph" onChange={(e) => {
                    if (!editor) return;
                    if (e.target.value === "paragraph") editor.chain().focus().setParagraph().run();
                    else editor.chain().focus().setHeading({ level: Number(e.target.value) }).run();
                  }}>
                    <option value="paragraph">Pastraipa</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                  </select>
                  <select style={{ ...inputBase, width: "auto" }} value={fontSize} onChange={(e) => { setFontSize(e.target.value); editor?.chain().focus().setFontSize(e.target.value).run(); }}>
                    <option value="12px">12 px</option>
                    <option value="14px">14 px</option>
                    <option value="16px">16 px</option>
                    <option value="18px">18 px</option>
                    <option value="24px">24 px</option>
                    <option value="32px">32 px</option>
                  </select>
                  <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); editor?.chain().focus().setColor(e.target.value).run(); }} style={{ width: "46px", height: "42px", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "4px", background: "#fff" }} />
                  {[
                    ["B", () => editor?.chain().focus().toggleBold().run()],
                    ["I", () => editor?.chain().focus().toggleItalic().run()],
                    ["U", () => editor?.chain().focus().toggleUnderline().run()],
                    ["•", () => editor?.chain().focus().toggleBulletList().run()],
                    ["1.", () => editor?.chain().focus().toggleOrderedList().run()],
                    ["←", () => editor?.chain().focus().setTextAlign("left").run()],
                    ["↔", () => editor?.chain().focus().setTextAlign("center").run()],
                    ["→", () => editor?.chain().focus().setTextAlign("right").run()]
                  ].map(([title, handler]) => (
                    <button key={title} type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px" }} onMouseDown={(e) => { e.preventDefault(); handler(); }}>
                      {title}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <button type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); insertTemplateBlock("infoTable"); }}>Info lentelė</button>
                  <button type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); insertTemplateBlock("priceTable"); }}>Kainų lentelė</button>
                  <button type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); insertTemplateBlock("pageBreak"); }}>Puslapio lūžis</button>
                  <button type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }}>Nauja lentelė</button>
                  <button type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click(); }}>Įkelti paveikslą</button>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <button type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().addRowAfter().run(); }}>+ Eilutė</button>
                  <button type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().addColumnAfter().run(); }}>+ Stulpelis</button>
                  <button type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().deleteRow().run(); }}>− Eilutė</button>
                  <button type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().deleteColumn().run(); }}>− Stulpelis</button>
                  <button type="button" style={{ ...btnSecondary, background: "#b91c1c", padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().deleteTable().run(); }}>Trinti lentelę</button>
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { void handleInlineImage(e); }} />
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>Dinaminiai laukai</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {templateFieldOptions.map((field) => (
                    <button key={field.key} type="button" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "999px", padding: "6px 10px", fontSize: "12px", cursor: "pointer" }} onMouseDown={(e) => { e.preventDefault(); insertField(field.key); }}>
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>
