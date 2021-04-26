import React, {
	useEffect,
	useState
} from 'react';

/* global window, Components */
window.Zotero = Components.classes['@zotero.org/Zotero;1']
	.getService(Components.interfaces.nsISupports)
	.wrappedJSObject
/* global Zotero */

const {
	citation,
	usedUUIDs,
	Wikicite,
	Wikidata
} = window.arguments[0];
const item = citation.target.item;
const sourceItem = citation.source;
const retVals = window.arguments[1];

// provide a shorter way to call Wikicite's getString
function getStr(name) {
	return Wikicite.getString(name);
}

// Fixme: as a Citation Editor (not a target item editor)
// consider providing at least some read only information about the citation
// such as label of the source item, OCIs, and Zotero link status
const CitationEditor = () => {
	const [itemType, setItemType] = useState(
		Zotero.ItemTypes.getName(item.itemTypeID)
	);
	const [title, setTitle] = useState(item.getField('title'));
	const [creators, setCreators] = useState(stringifyCreators(item.getCreators()));
	const [publication, setPublication] = useState(item.getField('publicationTitle'));
	const [date, setDate] = useState(item.getField('date'));
	const [doi, setDoi] = useState(item.getField('DOI'));
	const [qid, setQid] = useState(citation.target.qid ?? '');
	const [occ, setOcc] = useState(citation.target.occ ?? '');

	const [key, setKey] = useState(item.key);
	const [linked, setLinked] = useState(Boolean(key));

	useEffect(() => {
		if (key) {
			const linkedItem = Zotero.Items.getByLibraryAndKey(
				sourceItem.libraryID, // the same way I can't relate to an item in another library
				// I can't link to another library; hence, use source item's libraryID
				key
			);
			setItemType(Zotero.ItemTypes.getName(linkedItem.itemTypeID));
			setTitle(linkedItem.getField('title'));
			setCreators(stringifyCreators(linkedItem.getCreators()));
			setPublication(linkedItem.getField('publicationTitle'));
			setDate(linkedItem.getField('date'));
			setDoi(linkedItem.getField('DOI'));
			setQid(Wikicite.getExtraField(linkedItem, 'qid')[0]);
			setOcc(Wikicite.getExtraField(linkedItem, 'occ')[0]);
			setLinked(true);
		} else {
			setLinked(false);
		}
	}, [key])

	function link() {
		alert('Linking to a Zotero item not yet supported.');
		// // const key = // open the seleect item dialog and wait for response
		// let key = 'EUZBQNX7';  // hard coding for now
		// // confirm that data will be overwritten
		// setKey(key);
	}

	function unlink() {
		setKey(undefined);
	}

	async function getQID() {
		const targetItem = citation.target;
		targetItem.item = makeItem();
		const qids = await Wikidata.reconcile(targetItem);
		const qid = qids.get(targetItem);
		if (qid) {
			setQid(qid);
		}
	}

	function onCancel() {
		retVals.item = false;
		window.close()
	}

	function stringifyCreators(creators) {
		return creators.map(
			(c) => `${c.lastName}${c.firstName ? ', ' + c.firstName : ''}`
		).join('\n')
	}

	function parseCreators(creators) {
		let parsedCreators = [];
		if (creators) {
			for (let creatorString of creators.split('\n')) {
				const creator = {}

				// Fixme: support creators other than 'author'
				creator.creatorTypeID = Zotero.CreatorTypes.getID('author');

				let [lastName, ...firstName] = creatorString.split(',');
				firstName = firstName.join(',');
				creator.lastName = lastName.trim();
				if (firstName) {
					creator.fieldMode = 0;
					creator.firstName = firstName.trim();
				} else {
					creator.fieldMode = 1;
				}
				parsedCreators.push(creator);
			}
		}
		return parsedCreators;
	}

	function makeItem() {
		let itemOut = new Zotero.Item();
		if (linked) {
			itemOut.libraryID = sourceItem.libraryID;
			itemOut.key = key;
		} else {
			itemOut.setType(Zotero.ItemTypes.getID(itemType));
			itemOut.setField('title', title);
			itemOut.setCreators(parseCreators(creators));
			itemOut.setField('publicationTitle', publication);
			itemOut.setField('date', date);
			itemOut.setField('DOI', doi);
			Wikicite.setExtraField(itemOut, 'qid', qid);
			Wikicite.setExtraField(itemOut, 'occ', occ);
		}
		return itemOut;
	}

	function onSave() {
		// Fixme: improve usedUUIDs check
		if (
			usedUUIDs.doi.includes(doi) ||
			usedUUIDs.qid.includes(qid) ||
			usedUUIDs.occ.includes(occ)
		) {
			window.alert('The citation list already includes a cited item with one of the UUIDs provided!')
			return;
		}
		const itemOut = makeItem();
		// Fixme: return the item wrapper
		retVals.item = itemOut;
		window.close()
	}

	function handleKeyPress(event) {
		if (event.code === "Enter") {
			onSave();
		}
	}

	return(
		<div>
			<form
				// If form submission is used, Mozilla's LoginManagerContent is triggered and fails
				// onSubmit={(event) => onSubmit(event)}
				// Fixme: move to CSS!
				style={{display: 'flex', flexDirection: 'column'}}
			>
				<label htmlFor="itemType">{getStr('item.type')}</label>
				<select
					id="itemType"
					value={itemType}
					onChange={(e) => setItemType(e.target.value)}
					disabled={linked}
				>
					<option value="journalArticle">
						{getStr('item.type.journal-article')}
					</option>
				</select>

				<label htmlFor="title">{getStr('item.title')}</label>
				<input
					type="text"
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					disabled={linked}
					onKeyPress={handleKeyPress}
				/>

				<label htmlFor="creators">{getStr('item.creators')}</label>
				{/* Fixme: provide better input for creators */}
				<textarea
					id="creators"
					value={creators}
					onChange={(e) => setCreators(e.target.value)}
					disabled={linked}
					placeholder={getStr('editor.creators.placeholder')}

				/>

				<label htmlFor="publication">{getStr('item.publication')}</label>
				<input
					type="text"
					id="publication"
					value={publication}
					onChange={(e) => setPublication(e.target.value)}
					disabled={linked}
					onKeyPress={handleKeyPress}
				/>

				<label htmlFor="date">{getStr('item.date')}</label>
				<input
					type="text"
					id="date"
					value={date}
					onChange={(e) => setDate(e.target.value)}
					disabled={linked}
					onKeyPress={handleKeyPress}
				/>

				<label htmlFor="doi">{getStr('item.doi')}</label>
				<input
					type="text"
					id="doi"
					value={doi}
					onChange={(e) => setDoi(e.target.value)}
					disabled={linked}
					onKeyPress={handleKeyPress}
				/>

				<label htmlFor="qid">{getStr('item.qid')}</label>
				<input
					type="text"
					id="qid"
					value={qid}
					onChange={(e) => setQid(e.target.value)}
					disabled={linked}
					onKeyPress={handleKeyPress}
				/>
				<button
					type="button"
					onClick={getQID}
					disabled={!title && !doi}
				>{getStr('editor.get-qid')}</button>

				<label htmlFor="occ">{getStr('item.occ')}</label>
				<input
					type="text"
					id="occ"
					value={occ}
					onChange={(e) => setOcc(e.target.value)}
					disabled={linked}
					onKeyPress={handleKeyPress}
				/>
				{/*<button
					type="button"
					title="Link/Unlink"  // testing tooltips
					onClick={linked ? unlink : link}
				>{linked ? 'Unlink' : 'Link'}</button>*/}
				<button type="button" onClick={onCancel}>
					{getStr('editor.cancel')}
				</button>
				<button type="button" onClick={onSave}>
					{getStr('editor.save')}
				</button>
			</form>
		</div>
	)
};

export default CitationEditor;
