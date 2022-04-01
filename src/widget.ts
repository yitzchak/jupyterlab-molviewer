//import { PathExt } from '@jupyterlab/coreutils';

import { Printing } from '@jupyterlab/apputils';

import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget,
  IDocumentWidget
} from '@jupyterlab/docregistry';

import { PromiseDelegate } from '@lumino/coreutils';

import { Message } from '@lumino/messaging';

import { Widget } from '@lumino/widgets';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NGL = require('ngl');

const MOL_CLASS = 'jp-MolViewer';

export class MolViewer extends Widget implements Printing.IPrintable {
  stage_container: any;
  stage_obj: any;
  rendered: any = false;

  constructor(context: DocumentRegistry.Context) {
    super();
    this.context = context;
    this.node.tabIndex = 0;
    this.addClass(MOL_CLASS);
//    this.stage_container = document.createElement('div');
//    this.node.appendChild(this.stage_container);
    this.stage_obj = new NGL.Stage(this.node, { backgroundColor: 'white' });

//    this._onTitleChanged();
//    context.pathChanged.connect(this._onTitleChanged, this);

    void context.ready.then(() => {
      if (this.isDisposed) {
        return;
      }
      //const contents = context.contentsModel!;
      //this._mimeType = contents.mimetype;
      this._render();
      //context.model.contentChanged.connect(this.update, this);
      //context.fileChanged.connect(this.update, this);
      //this._ready.resolve(void 0);
    });
  }

  [Printing.symbol]() {
    return (): Promise<void> => Printing.printWidget(this);
  }

  readonly context: DocumentRegistry.Context;

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  dispose(): void {
    super.dispose();
  }

  protected onUpdateRequest(msg: Message): void {
    if (this.isDisposed || !this.context.isReady) {
      return;
    }
    this._render();
  }

  protected onActivateRequest(msg: Message): void {
    this.node.focus();
  }

  onResize(msg: Widget.ResizeMessage): void {
    this.stage_obj.setSize(Math.floor(msg.width) + 'px', Math.floor(msg.height) + 'px');
  }

  // private _onTitleChanged(): void {
  //   this.title.label = PathExt.basename(this.context.localPath);
  // }

  private addElement (el: any): void {
    Object.assign(el.style, {
      position: 'absolute',
      zIndex: 10
    })
    this.stage_obj.viewer.container.appendChild(el)
  }

  private createElement (name: any, properties: any, style: any): void {
    var el = document.createElement(name)
    Object.assign(el, properties)
    Object.assign(el.style, style)
    return el
  }

  private _render(): void {
    if (!this.rendered) {
    this.rendered = true;
    this.context.urlResolver.getDownloadUrl(this.context.path)
      .then((url: string) => {
        this.stage_obj.loadFile(url)//, { asTrajectory: this.context.path.match(/\.(mmcif|pdb|pqr|ent|gro|sdf|sd|mol2|mmtf|)$/) && true })
        .then((o: any) => {
          if (o.structure.modelStore.count > 1) {
            o.setSelection('/0')
            var modelRange: any = this.createElement('input', {
              type: 'range',
              value: 0,
              min: 0,
              max: o.structure.modelStore.count - 1,
              step: 1
            }, { top: '12px', left: '12px' })
            modelRange.oninput = function (e: any) {
              o.setSelection('/' + e.target.value)
            }
            this.addElement(modelRange)
          }

          if (this.context.path.match(/\.(mol2|sdf?)$/)) {
            o.addRepresentation('ball+stick')
          } else {
            o.addRepresentation('ribbon', { colorScheme: 'residueindex' })
          }
          o.autoView()
        })
      })
    }
  }

  private _ready = new PromiseDelegate<void>();
}

export class MolViewerFactory extends ABCWidgetFactory<
  IDocumentWidget<MolViewer>
> {
  protected createNewWidget(
    context: DocumentRegistry.IContext<DocumentRegistry.IModel>
  ): IDocumentWidget<MolViewer> {
    const content = new MolViewer(context);
    const widget = new DocumentWidget({ content, context });
    return widget;
  }
}

