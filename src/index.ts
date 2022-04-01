import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { DocumentRegistry, IDocumentWidget } from '@jupyterlab/docregistry';
import { IMolTracker } from './tokens';
import {
  MolViewer,
  MolViewerFactory
} from './widget';

const FILE_TYPES = [{
  displayName: 'Crystallographic Information File',
  name: 'cif',
  mimeTypes: ['chemical/x-cif'],
  extensions: ['.cif']
}, {
  displayName: 'Macromolecular Crystallographic Information File',
  name: 'mmcif',
  mimeTypes: ['chemical/x-mmcif'],
  extensions: ['.mmcif']
}, {
  displayName: 'Tripos Mol2',
  name: 'mol2',
  extensions: ['.mol2']
}, {
  displayName: 'Protein Data Bank File',
  name: 'pdb',
  mimeTypes: ['chemical/x-pdb'],
  extensions: ['.pdb', '.pqr', '.ent']
}, {
  displayName: 'MDL Molfile',
  name: 'mol',
  mimeTypes: ['chemical/x-mdl-molfile'],
  extensions: ['.mol']
}, {
  displayName: 'Structure Data File',
  name: 'sdf',
  mimeTypes: ['chemical/x-mdl-sdfile'],
  extensions: ['.sdf', '.sd']
}]

const FACTORY = 'Molecule Viewer';

const plugin: JupyterFrontEndPlugin<IMolTracker> = {
  activate,
  id: 'jupyterlab-molbiewer-extension:plugin',
  provides: IMolTracker,
  requires: [],
  optional: [ICommandPalette, ILayoutRestorer],
  autoStart: true
};

export default plugin;

function activate(
  app: JupyterFrontEnd,
  palette: ICommandPalette | null,
  restorer: ILayoutRestorer | null,
): IMolTracker {
  const namespace = 'mol-widget';

  function onWidgetCreated(
    sender: any,
    widget: IDocumentWidget<MolViewer, DocumentRegistry.IModel>
  ) {
    widget.context.pathChanged.connect(() => {
      void tracker.save(widget);
    });
    void tracker.add(widget);

    const types = app.docRegistry.getFileTypesForPath(widget.context.path);

    if (types.length > 0) {
      widget.title.icon = types[0].icon!;
      widget.title.iconClass = types[0].iconClass ?? '';
      widget.title.iconLabel = types[0].iconLabel ?? '';
    }
  }

  FILE_TYPES.forEach(type => app.docRegistry.addFileType(type))
  const FILE_TYPE_NAMES = FILE_TYPES.map(type => type.name)

  const factory = new MolViewerFactory({
    name: FACTORY,
    fileTypes: FILE_TYPE_NAMES,
    defaultFor: FILE_TYPE_NAMES,
    readOnly: true
  });

  app.docRegistry.addWidgetFactory(factory);
  factory.widgetCreated.connect(onWidgetCreated);

  const tracker = new WidgetTracker<IDocumentWidget<MolViewer>>({
    namespace
  });

  if (restorer) {
    void restorer.restore(tracker, {
      command: 'docmanager:open',
      args: widget => ({
        path: widget.context.path,
        factory: FACTORY
      }),
      name: widget => widget.context.path
    });
  }

  console.log("jupyterlab-molviewer activated")

  return tracker;
}

